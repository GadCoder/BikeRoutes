from __future__ import annotations

import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.deps import get_optional_user
from app.auth.models import User
from app.core.rate_limit import limiter, RateLimits
from app.db import get_db
from app.geo.geojson import linestring_wkt_from_geojson, point_wkt_from_geojson
from app.models.route import Route
from app.models.marker import Marker

router = APIRouter(prefix="/routes")


class RouteCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    geometry: dict  # GeoJSON LineString
    is_public: bool = False


class RouteUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    geometry: Optional[dict] = None  # GeoJSON LineString
    is_public: Optional[bool] = None


class MarkerCreateRequest(BaseModel):
    geometry: dict  # GeoJSON Point
    label: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon_type: str = Field(default="default", max_length=50)
    order_index: Optional[int] = None  # if omitted, append to end


class MarkerUpdateRequest(BaseModel):
    geometry: Optional[dict] = None  # GeoJSON Point
    label: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    icon_type: Optional[str] = Field(None, max_length=50)
    order_index: Optional[int] = None


class MarkerOut(BaseModel):
    id: str
    geometry: dict
    label: Optional[str]
    description: Optional[str]
    icon_type: str
    order_index: int


class RouteOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    geometry: dict
    distance_km: float
    is_public: bool
    created_at: str
    updated_at: str
    markers: list[MarkerOut]

    class Config:
        from_attributes = True


def _haversine_km(a: list[float], b: list[float]) -> float:
    # a/b are [lon, lat]
    import math

    R = 6371.0
    lon1, lat1 = math.radians(a[0]), math.radians(a[1])
    lon2, lat2 = math.radians(b[0]), math.radians(b[1])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(min(1.0, math.sqrt(h)))


def _distance_km_from_linestring_geojson(geometry: dict) -> float:
    coords = geometry.get("coordinates")
    if not (isinstance(coords, list) and len(coords) >= 2):
        return 0.0
    total = 0.0
    for i in range(1, len(coords)):
        a = coords[i - 1]
        b = coords[i]
        if not (isinstance(a, list) and isinstance(b, list) and len(a) == 2 and len(b) == 2):
            continue
        try:
            total += _haversine_km([float(a[0]), float(a[1])], [float(b[0]), float(b[1])])
        except Exception:
            continue
    return float(total)


async def _geojson_for_route(db: AsyncSession, route_id: uuid.UUID) -> dict:
    geojson_str = await db.scalar(
        select(func.ST_AsGeoJSON(Route.geometry)).where(Route.id == route_id)
    )
    if not geojson_str:
        return {"type": "LineString", "coordinates": []}
    return json.loads(geojson_str)


async def _marker_rows_with_geojson(db: AsyncSession, route_id: uuid.UUID) -> list[tuple[Marker, str | None]]:
    rows = (
        await db.execute(
            select(Marker, func.ST_AsGeoJSON(Marker.geometry))
            .where(Marker.route_id == route_id)
            .order_by(Marker.order_index.asc())
        )
    ).all()
    return [(m, gj) for (m, gj) in rows]


async def _serialize_route(db: AsyncSession, route: Route) -> RouteOut:
    geometry = await _geojson_for_route(db, route.id)
    marker_rows = await _marker_rows_with_geojson(db, route.id)
    markers: list[MarkerOut] = []
    for m, gj in marker_rows:
        mg = json.loads(gj) if gj else {"type": "Point", "coordinates": [0, 0]}
        markers.append(
            MarkerOut(
                id=str(m.id),
                geometry=mg,
                label=m.label,
                description=m.description,
                icon_type=m.icon_type,
                order_index=m.order_index,
            )
        )

    return RouteOut(
        id=str(route.id),
        title=route.title,
        description=route.description,
        geometry=geometry,
        distance_km=float(route.distance_km),
        is_public=bool(route.is_public),
        created_at=route.created_at.isoformat() if getattr(route, "created_at", None) else "",
        updated_at=route.updated_at.isoformat() if getattr(route, "updated_at", None) else "",
        markers=markers,
    )


async def _serialize_marker(db: AsyncSession, marker: Marker) -> MarkerOut:
    geojson_str = await db.scalar(select(func.ST_AsGeoJSON(Marker.geometry)).where(Marker.id == marker.id))
    mg = json.loads(geojson_str) if geojson_str else {"type": "Point", "coordinates": [0, 0]}
    return MarkerOut(
        id=str(marker.id),
        geometry=mg,
        label=marker.label,
        description=marker.description,
        icon_type=marker.icon_type,
        order_index=marker.order_index,
    )


@router.get("", response_model=list[RouteOut])
@limiter.limit(RateLimits.ROUTES_LIST)
async def list_routes(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List routes for current user."""
    result = await db.execute(
        select(Route).where(Route.user_id == user.id).order_by(Route.created_at.desc())
    )
    routes = result.scalars().all()
    return [await _serialize_route(db, r) for r in routes]


@router.post("", response_model=RouteOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.CREATE)
async def create_route(
    request: Request,
    payload: RouteCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Create a new route."""
    try:
        geom = linestring_wkt_from_geojson(payload.geometry)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    distance_km = _distance_km_from_linestring_geojson(payload.geometry)
    route = Route(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        geometry=geom,
        is_public=payload.is_public,
        distance_km=distance_km,
    )
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return await _serialize_route(db, route)


@router.get("/{route_id}", response_model=RouteOut)
@limiter.limit(RateLimits.ROUTE_DETAIL)
async def get_route(
    request: Request,
    route_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user)
):
    """Get route details."""
    rid = uuid.UUID(route_id)
    route = await db.get(Route, rid)

    # Unauthenticated users can only access public routes; otherwise respond 401
    # to avoid leaking route existence.
    if user is None:
        if not route or not route.is_public:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return await _serialize_route(db, route)

    if not route:
        raise HTTPException(status_code=404, detail="route_not_found")

    # Check ownership or public access
    if route.user_id != user.id and not route.is_public:
        raise HTTPException(status_code=404, detail="route_not_found")

    return await _serialize_route(db, route)


@router.put("/{route_id}", response_model=RouteOut)
@limiter.limit(RateLimits.UPDATE)
async def update_route(
    request: Request,
    route_id: str,
    payload: RouteUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update a route."""
    route = await db.get(Route, uuid.UUID(route_id))
    
    if not route or route.user_id != user.id:
        raise HTTPException(status_code=404, detail="route_not_found")
    
    if payload.title is not None:
        route.title = payload.title
    if payload.description is not None:
        route.description = payload.description
    if payload.geometry is not None:
        try:
            route.geometry = linestring_wkt_from_geojson(payload.geometry)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        route.distance_km = _distance_km_from_linestring_geojson(payload.geometry)
    if payload.is_public is not None:
        route.is_public = payload.is_public
    
    await db.commit()
    await db.refresh(route)
    return await _serialize_route(db, route)


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(RateLimits.DELETE)
async def delete_route(
    request: Request,
    route_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Delete a route."""
    route = await db.get(Route, uuid.UUID(route_id))
    
    if not route or route.user_id != user.id:
        raise HTTPException(status_code=404, detail="route_not_found")
    
    await db.delete(route)
    await db.commit()
    return None


@router.post("/{route_id}/markers", response_model=MarkerOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.CREATE)
async def create_marker(
    request: Request,
    route_id: str,
    payload: MarkerCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    route = await db.get(Route, uuid.UUID(route_id))
    if not route or route.user_id != user.id:
        raise HTTPException(status_code=404, detail="route_not_found")

    try:
        geom = point_wkt_from_geojson(payload.geometry)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if payload.order_index is None:
        max_idx = await db.scalar(
            select(func.coalesce(func.max(Marker.order_index), -1)).where(Marker.route_id == route.id)
        )
        order_index = int(max_idx or -1) + 1
    else:
        order_index = int(payload.order_index)

    marker = Marker(
        route_id=route.id,
        geometry=geom,
        label=payload.label,
        description=payload.description,
        icon_type=payload.icon_type,
        order_index=order_index,
    )
    db.add(marker)
    await db.commit()
    await db.refresh(marker)
    return await _serialize_marker(db, marker)


@router.put("/{route_id}/markers/{marker_id}", response_model=MarkerOut)
@limiter.limit(RateLimits.UPDATE)
async def update_marker(
    request: Request,
    route_id: str,
    marker_id: str,
    payload: MarkerUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    route = await db.get(Route, uuid.UUID(route_id))
    if not route or route.user_id != user.id:
        raise HTTPException(status_code=404, detail="route_not_found")

    marker = await db.get(Marker, uuid.UUID(marker_id))
    if not marker or marker.route_id != route.id:
        raise HTTPException(status_code=404, detail="marker_not_found")

    if payload.geometry is not None:
        try:
            marker.geometry = point_wkt_from_geojson(payload.geometry)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
    if payload.label is not None:
        marker.label = payload.label
    if payload.description is not None:
        marker.description = payload.description
    if payload.icon_type is not None:
        marker.icon_type = payload.icon_type
    if payload.order_index is not None:
        marker.order_index = int(payload.order_index)

    await db.commit()
    await db.refresh(marker)
    return await _serialize_marker(db, marker)


@router.delete("/{route_id}/markers/{marker_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(RateLimits.DELETE)
async def delete_marker(
    request: Request,
    route_id: str,
    marker_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    route = await db.get(Route, uuid.UUID(route_id))
    if not route or route.user_id != user.id:
        raise HTTPException(status_code=404, detail="route_not_found")

    marker = await db.get(Marker, uuid.UUID(marker_id))
    if not marker or marker.route_id != route.id:
        raise HTTPException(status_code=404, detail="marker_not_found")

    await db.delete(marker)
    await db.commit()
    return None
