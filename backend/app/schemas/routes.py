from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.geojson import GeoJSONFeature, GeoJSONGeometry


class RouteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    geometry: GeoJSONGeometry
    is_public: bool = False
    # Client may send this, but server will ignore and compute canonical value.
    distance_km: float | None = None


class RouteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    geometry: GeoJSONGeometry | None = None
    is_public: bool | None = None
    distance_km: float | None = None


class MarkerCreate(BaseModel):
    geometry: GeoJSONGeometry
    label: str | None = Field(default=None, max_length=100)
    description: str | None = None
    icon_type: str = Field(default="default", max_length=50)
    order_index: int = 0


class MarkerUpdate(BaseModel):
    geometry: GeoJSONGeometry | None = None
    label: str | None = Field(default=None, max_length=100)
    description: str | None = None
    icon_type: str | None = Field(default=None, max_length=50)
    order_index: int | None = None


class RouteFeature(GeoJSONFeature):
    geometry: GeoJSONGeometry
    properties: dict[str, Any]


class MarkerFeature(GeoJSONFeature):
    geometry: GeoJSONGeometry
    properties: dict[str, Any]

