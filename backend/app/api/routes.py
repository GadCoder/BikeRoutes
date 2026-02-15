from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import User
from app.core.rate_limit import limiter, RateLimits
from app.db import get_db
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
    is_public: Optional[bool] = None


class RouteOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    geometry: dict
    distance_km: float
    is_public: bool
    created_at: str
    updated_at: str
    markers: list

    class Config:
        from_attributes = True


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
    return routes


@router.post("", response_model=RouteOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimits.CREATE)
async def create_route(
    request: Request,
    payload: RouteCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Create a new route."""
    route = Route(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        geometry=payload.geometry,  # Will be converted by GeoAlchemy2
        is_public=payload.is_public,
    )
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return route


@router.get("/{route_id}", response_model=RouteOut)
@limiter.limit(RateLimits.ROUTE_DETAIL)
async def get_route(
    request: Request,
    route_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get route details."""
    route = await db.get(Route, uuid.UUID(route_id))
    
    if not route:
        raise HTTPException(status_code=404, detail="route_not_found")
    
    # Check ownership or public access
    if route.user_id != user.id and not route.is_public:
        raise HTTPException(status_code=404, detail="route_not_found")
    
    return route


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
    if payload.is_public is not None:
        route.is_public = payload.is_public
    
    await db.commit()
    await db.refresh(route)
    return route


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
