from __future__ import annotations

import uuid
from typing import Any, Literal

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.contracts import UserPrincipal
from app.auth.dependencies import get_current_user, get_optional_current_user
from app.db.session import get_db_session
from app.geo.geojson import linestring_wkt_from_geojson, point_wkt_from_geojson
from app.models.marker import Marker
from app.models.route import Route

router = APIRouter(prefix="/routes", tags=["routes"])


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


def _route_dict(route: Route, *, include_markers: bool, markers: list[dict] | None = None) -> dict[str, Any]:
    out: dict[str, Any] = {
        "id": str(route.id),
        "title": route.title,
        "description": route.description,
        "distance_km": route.distance_km,
        "is_public": route.is_public,
    }
    if include_markers:
        out["markers"] = markers or []
    return out


def _marker_dict(marker: Marker) -> dict[str, Any]:
    return {
        "id": str(marker.id),
        "label": marker.label,
        "description": marker.description,
        "icon_type": marker.icon_type,
        "order_index": marker.order_index,
    }


@router.get("", response_model=list[dict])
async def list_routes(
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal | None = Depends(get_optional_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort: Literal["created_at", "updated_at", "distance_km"] = Query(default="updated_at"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    q: str | None = Query(default=None),
    bbox: str | None = Query(default=None),
) -> list[dict]:
    conditions: list[sa.ColumnElement[bool]] = []
    if user is None:
        conditions.append(Route.is_public.is_(True))
    else:
        conditions.append(sa.or_(Route.is_public.is_(True), Route.user_id == user.id))

    if q:
        conditions.append(Route.title.ilike(f"%{q}%"))

    if bbox:
        min_lng, min_lat, max_lng, max_lat = _parse_bbox(bbox)
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
    return [_route_dict(r, include_markers=False) for r in routes]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_route(
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> dict:
    title = payload.get("title")
    if not isinstance(title, str) or not title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title is required")

    geometry = payload.get("geometry")
    if not isinstance(geometry, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="geometry is required")
    try:
        geom = linestring_wkt_from_geojson(geometry)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    route = Route(
        user_id=user.id,
        title=title.strip(),
        description=payload.get("description"),
        geometry=geom,
        is_public=bool(payload.get("is_public", False)),
        # Track C 3.5 will make this canonical and server-computed; for now we default to 0.
        distance_km=0.0,
    )
    session.add(route)
    await session.commit()
    await session.refresh(route)
    return _route_dict(route, include_markers=True, markers=[])


@router.get("/{route_id}", response_model=dict)
async def get_route(
    route_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal | None = Depends(get_optional_current_user),
) -> dict:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    if not _can_view_route(route, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    markers = (
        await session.execute(
            sa.select(Marker).where(Marker.route_id == route_id).order_by(Marker.order_index.asc(), Marker.created_at.asc())
        )
    ).scalars().all()
    return _route_dict(route, include_markers=True, markers=[_marker_dict(m) for m in markers])


@router.put("/{route_id}", response_model=dict)
async def update_route(
    route_id: uuid.UUID,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> dict:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    if "title" in payload:
        title = payload.get("title")
        if not isinstance(title, str) or not title.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="title must be non-empty")
        route.title = title.strip()
    if "description" in payload:
        route.description = payload.get("description")
    if "is_public" in payload:
        route.is_public = bool(payload.get("is_public"))
    if "geometry" in payload and payload.get("geometry") is not None:
        geometry = payload.get("geometry")
        if not isinstance(geometry, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="geometry must be an object")
        try:
            route.geometry = linestring_wkt_from_geojson(geometry)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    # Ignore client-supplied distance_km; Track C 3.5 will compute canonical value on the server.
    await session.commit()
    await session.refresh(route)

    markers = (
        await session.execute(
            sa.select(Marker).where(Marker.route_id == route_id).order_by(Marker.order_index.asc(), Marker.created_at.asc())
        )
    ).scalars().all()
    return _route_dict(route, include_markers=True, markers=[_marker_dict(m) for m in markers])


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
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


@router.get("/{route_id}/markers", response_model=list[dict])
async def list_markers(
    route_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal | None = Depends(get_optional_current_user),
) -> list[dict]:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    if not _can_view_route(route, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    markers = (
        await session.execute(
            sa.select(Marker).where(Marker.route_id == route_id).order_by(Marker.order_index.asc(), Marker.created_at.asc())
        )
    ).scalars().all()
    return [_marker_dict(m) for m in markers]


@router.post("/{route_id}/markers", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_marker(
    route_id: uuid.UUID,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> dict:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    geometry = payload.get("geometry")
    if not isinstance(geometry, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="geometry is required")
    try:
        geom = point_wkt_from_geojson(geometry)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    marker = Marker(
        route_id=route_id,
        geometry=geom,
        label=payload.get("label"),
        description=payload.get("description"),
        icon_type=str(payload.get("icon_type") or "default"),
        order_index=int(payload.get("order_index") or 0),
    )
    session.add(marker)
    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Marker order_index conflict") from e
    await session.refresh(marker)
    return _marker_dict(marker)


@router.put("/{route_id}/markers/{marker_id}", response_model=dict)
async def update_marker(
    route_id: uuid.UUID,
    marker_id: uuid.UUID,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    user: UserPrincipal = Depends(get_current_user),
) -> dict:
    route = (await session.execute(sa.select(Route).where(Route.id == route_id))).scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    _require_owner(route, user)

    marker = (
        await session.execute(sa.select(Marker).where(Marker.id == marker_id, Marker.route_id == route_id))
    ).scalar_one_or_none()
    if marker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marker not found")

    if "label" in payload:
        marker.label = payload.get("label")
    if "description" in payload:
        marker.description = payload.get("description")
    if "icon_type" in payload and payload.get("icon_type") is not None:
        marker.icon_type = str(payload.get("icon_type"))
    if "order_index" in payload and payload.get("order_index") is not None:
        marker.order_index = int(payload.get("order_index"))
    if "geometry" in payload and payload.get("geometry") is not None:
        geometry = payload.get("geometry")
        if not isinstance(geometry, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="geometry must be an object")
        try:
            marker.geometry = point_wkt_from_geojson(geometry)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Marker order_index conflict") from e
    await session.refresh(marker)
    return _marker_dict(marker)


@router.delete("/{route_id}/markers/{marker_id}", status_code=status.HTTP_204_NO_CONTENT)
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

