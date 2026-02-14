from __future__ import annotations

import json
import secrets
import uuid
from typing import Any, Literal

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from geoalchemy2 import Geography
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.contracts import UserPrincipal
from app.auth.dependencies import get_current_user, get_optional_current_user
from app.db.session import get_db_session
from app.geo.geojson import linestring_wkt_from_geojson, point_wkt_from_geojson
from app.models.marker import Marker
from app.models.route import Route
from app.schemas.routes import MarkerCreate, MarkerFeature, MarkerUpdate, RouteCreate, RouteFeature, RouteUpdate

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("/share/{token}", response_model=RouteFeature)
async def get_shared_route(
    token: str,
    session: AsyncSession = Depends(get_db_session),
) -> RouteFeature:
    # Public read-only access via share token.
    route = (
        await session.execute(
            sa.select(Route)
            .options(selectinload(Route.markers))
            .where(Route.share_token == token, Route.is_public.is_(True))
        )
    ).scalar_one_or_none()

    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")

    geometry = await _route_geometry_geojson(session, route.id)
    markers = await _markers_features(session, route.id)
    return _route_feature(route, geometry, markers, include_share_token=False)


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    parts = [p.strip() for p in bbox.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must be minLng,minLat,maxLng,maxLat")
    min_lng, min_lat, max_lng, max_lat = [float(p) for p in parts]
    if min_lng >= max_lng or min_lat >= max_lat:
        raise ValueError("bbox min must be < max")
    return min_lng, min_lat, max_lng, max_lat


def _can_view_route(route: Route, user: UserPrincipal | None) -> bool:
    return bool(route.is_public) or (user is not None and route.user_id == user.id)


def _require_owner(route: Route, user: UserPrincipal) -> None:
    if route.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


async def _compute_and_persist_distance_km(session: AsyncSession, route_id: uuid.UUID) -> float:
    stmt = sa.select((sa.func.ST_Length(sa.cast(Route.geometry, Geography)) / 1000.0).label("distance_km")).where(
        Route.id == route_id
    )
    distance_km = float((await session.execute(stmt)).scalar_one())
    await session.execute(sa.update(Route).where(Route.id == route_id).values(distance_km=distance_km))
    return distance_km


async def _route_geometry_geojson(session: AsyncSession, route_id: uuid.UUID) -> dict[str, Any]:
    geom_json = (
        await session.execute(sa.select(sa.func.ST_AsGeoJSON(Route.geometry)).where(Route.id == route_id))
    ).scalar_one()
    return json.loads(geom_json)


async def _markers_features(session: AsyncSession, route_id: uuid.UUID) -> list[MarkerFeature]:
    stmt = (
        sa.select(
            Marker.id,
            Marker.label,
            Marker.description,
            Marker.icon_type,
            Marker.order_index,
            sa.func.ST_AsGeoJSON(Marker.geometry).label("geom_json"),
        )
        .where(Marker.route_id == route_id)
        .order_by(Marker.order_index.asc(), Marker.created_at.asc())
    )
    rows = (await session.execute(stmt)).all()
    out: list[MarkerFeature] = []
    for r in rows:
        out.append(
            MarkerFeature(
                id=str(r.id),
                geometry=json.loads(r.geom_json),
                properties={
                    "label": r.label,
                    "description": r.description,
                    "icon_type": r.icon_type,
                    "order_index": r.order_index,
                },
            )
        )
    return out


def _route_feature(
    route: Route,
    geometry: dict[str, Any],
    markers: list[MarkerFeature],
    *,
    include_share_token: bool = False,
) -> RouteFeature:
    props: dict[str, Any] = {
        "title": route.title,
        "description": route.description,
        "distance_km": route.distance_km,
        "is_public": route.is_public,
        "markers": [m.model_dump() for m in markers],
    }
    if include_share_token:
        props["share_token"] = route.share_token

    return RouteFeature(
        id=str(route.id),
        geometry=geometry,
        properties=props,
    )


def _generate_share_token() -> str:
    # 64 chars max, URL-safe.
    return secrets.token_urlsafe(32)[:64]


@router.get("", response_model=list[RouteFeature])
async def list_routes(
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal | None = Depends(get_optional_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort: Literal["created_at", "updated_at", "distance_km"] = Query(default="updated_at"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    q: str | None = Query(default=None),
    bbox: str | None = Query(default=None),
) -> list[RouteFeature]:
    conditions: list[sa.ColumnElement[bool]] = []
    if user is None:
        conditions.append(Route.is_public.is_(True))
    else:
        conditions.append(sa.or_(Route.is_public.is_(True), Route.user_id == user.id))

    if q:
        conditions.append(Route.title.ilike(f"%{q}%"))

    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = _parse_bbox(bbox)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        envelope = sa.func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        conditions.append(sa.func.ST_Intersects(Route.geometry, envelope))

    sort_col = getattr(Route, sort)
    sort_expr = sort_col.asc() if order == "asc" else sort_col.desc()

    stmt = (
        sa.select(Route)
        .where(sa.and_(*conditions))
        .order_by(sort_expr, Route.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    routes = (await session.execute(stmt)).scalars().all()
    if not routes:
        return []

    owner_route_ids: set[uuid.UUID] = set()
    if user is not None:
        owner_route_ids = {r.id for r in routes if r.user_id == user.id}

    route_ids = [r.id for r in routes]
    geom_stmt = sa.select(Route.id, sa.func.ST_AsGeoJSON(Route.geometry).label("geom_json")).where(Route.id.in_(route_ids))
    geom_rows = (await session.execute(geom_stmt)).all()
    geom_by_id = {r.id: json.loads(r.geom_json) for r in geom_rows}

    marker_stmt = (
        sa.select(
            Marker.route_id,
            Marker.id,
            Marker.label,
            Marker.description,
            Marker.icon_type,
            Marker.order_index,
            sa.func.ST_AsGeoJSON(Marker.geometry).label("geom_json"),
        )
        .where(Marker.route_id.in_(route_ids))
        .order_by(Marker.route_id.asc(), Marker.order_index.asc(), Marker.created_at.asc())
    )
    marker_rows = (await session.execute(marker_stmt)).all()
    markers_by_route: dict[uuid.UUID, list[MarkerFeature]] = {rid: [] for rid in route_ids}
    for mr in marker_rows:
        markers_by_route[mr.route_id].append(
            MarkerFeature(
                id=str(mr.id),
                geometry=json.loads(mr.geom_json),
                properties={
                    "label": mr.label,
                    "description": mr.description,
                    "icon_type": mr.icon_type,
                    "order_index": mr.order_index,
                },
            )
        )

    return [
        _route_feature(
            r,
            geom_by_id[r.id],
            markers_by_route.get(r.id, []),
            include_share_token=(r.id in owner_route_ids),
        )
        for r in routes
    ]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RouteFeature)
async def create_route(
    payload: RouteCreate,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> RouteFeature:
    try:
        geom = linestring_wkt_from_geojson(payload.geometry.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    route = Route(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        geometry=geom,
        is_public=payload.is_public,
        distance_km=0.0,  # always overwritten by canonical computation below
    )
    session.add(route)
    await session.flush()

    await _compute_and_persist_distance_km(session, route.id)

    if route.is_public and route.share_token is None:
        route.share_token = _generate_share_token()

    await session.commit()
    await session.refresh(route)

    geometry = await _route_geometry_geojson(session, route.id)
    return _route_feature(route, geometry, [], include_share_token=True)


@router.get("/{route_id}", response_model=RouteFeature)
async def get_route(
    route_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal | None = Depends(get_optional_current_user),
) -> RouteFeature:
    route = (
        await session.execute(sa.select(Route).options(selectinload(Route.markers)).where(Route.id == route_id))
    ).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    if not _can_view_route(route, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    geometry = await _route_geometry_geojson(session, route.id)
    markers = await _markers_features(session, route.id)
    include_share = user is not None and route.user_id == user.id
    return _route_feature(route, geometry, markers, include_share_token=include_share)


@router.put("/{route_id}", response_model=RouteFeature)
async def update_route(
    route_id: uuid.UUID,
    payload: RouteUpdate,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> RouteFeature:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    if payload.title is not None:
        route.title = payload.title
    if payload.description is not None:
        route.description = payload.description
    if payload.is_public is not None:
        route.is_public = payload.is_public
        if route.is_public and route.share_token is None:
            route.share_token = _generate_share_token()
    if payload.geometry is not None:
        try:
            route.geometry = linestring_wkt_from_geojson(payload.geometry.model_dump())
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        await session.flush()
        await _compute_and_persist_distance_km(session, route.id)

    # Ignore client-supplied distance_km (canonical server computed).
    await session.commit()
    await session.refresh(route)

    geometry = await _route_geometry_geojson(session, route.id)
    markers = await _markers_features(session, route.id)
    return _route_feature(route, geometry, markers, include_share_token=True)


@router.delete("/{route_id}")
async def delete_route(
    route_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> None:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)
    await session.delete(route)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{route_id}/markers", response_model=list[MarkerFeature])
async def list_markers(
    route_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal | None = Depends(get_optional_current_user),
) -> list[MarkerFeature]:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    if not _can_view_route(route, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return await _markers_features(session, route_id)


@router.post("/{route_id}/markers", status_code=status.HTTP_201_CREATED, response_model=MarkerFeature)
async def create_marker(
    route_id: uuid.UUID,
    payload: MarkerCreate,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> MarkerFeature:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    try:
        geom = point_wkt_from_geojson(payload.geometry.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    marker = Marker(
        route_id=route_id,
        geometry=geom,
        label=payload.label,
        description=payload.description,
        icon_type=payload.icon_type,
        order_index=payload.order_index,
    )
    session.add(marker)
    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Marker order_index conflict") from e

    geom_json = (
        await session.execute(sa.select(sa.func.ST_AsGeoJSON(Marker.geometry)).where(Marker.id == marker.id))
    ).scalar_one()
    return MarkerFeature(
        id=str(marker.id),
        geometry=json.loads(geom_json),
        properties={
            "label": marker.label,
            "description": marker.description,
            "icon_type": marker.icon_type,
            "order_index": marker.order_index,
        },
    )


@router.put("/{route_id}/markers/{marker_id}", response_model=MarkerFeature)
async def update_marker(
    route_id: uuid.UUID,
    marker_id: uuid.UUID,
    payload: MarkerUpdate,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> MarkerFeature:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    marker = (
        await session.execute(sa.select(Marker).where(Marker.id == marker_id, Marker.route_id == route_id))
    ).scalar_one_or_none()
    if marker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marker not found")

    if payload.label is not None:
        marker.label = payload.label
    if payload.description is not None:
        marker.description = payload.description
    if payload.icon_type is not None:
        marker.icon_type = payload.icon_type
    if payload.order_index is not None:
        marker.order_index = payload.order_index
    if payload.geometry is not None:
        try:
            marker.geometry = point_wkt_from_geojson(payload.geometry.model_dump())
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Marker order_index conflict") from e

    geom_json = (
        await session.execute(sa.select(sa.func.ST_AsGeoJSON(Marker.geometry)).where(Marker.id == marker.id))
    ).scalar_one()
    return MarkerFeature(
        id=str(marker.id),
        geometry=json.loads(geom_json),
        properties={
            "label": marker.label,
            "description": marker.description,
            "icon_type": marker.icon_type,
            "order_index": marker.order_index,
        },
    )


@router.delete("/{route_id}/markers/{marker_id}")
async def delete_marker(
    route_id: uuid.UUID,
    marker_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> None:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    marker = (
        await session.execute(sa.select(Marker).where(Marker.id == marker_id, Marker.route_id == route_id))
    ).scalar_one_or_none()
    if marker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marker not found")
    await session.delete(marker)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
