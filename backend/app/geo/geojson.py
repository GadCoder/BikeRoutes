from __future__ import annotations

from typing import Any, Literal, TypeGuard

from geoalchemy2.elements import WKTElement


def _is_number(x: Any) -> TypeGuard[int | float]:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def point_wkt_from_geojson(geometry: dict[str, Any], *, srid: int = 4326) -> WKTElement:
    if geometry.get("type") != "Point":
        raise ValueError("Expected GeoJSON Point geometry")
    coords = geometry.get("coordinates")
    if not (isinstance(coords, list) and len(coords) == 2 and _is_number(coords[0]) and _is_number(coords[1])):
        raise ValueError("Invalid GeoJSON Point coordinates")
    lng, lat = float(coords[0]), float(coords[1])
    return WKTElement(f"POINT({lng} {lat})", srid=srid)


def linestring_wkt_from_geojson(geometry: dict[str, Any], *, srid: int = 4326) -> WKTElement:
    if geometry.get("type") != "LineString":
        raise ValueError("Expected GeoJSON LineString geometry")
    coords = geometry.get("coordinates")
    if not (isinstance(coords, list) and len(coords) >= 2):
        raise ValueError("Invalid GeoJSON LineString coordinates")
    parts: list[str] = []
    for pt in coords:
        if not (isinstance(pt, list) and len(pt) == 2 and _is_number(pt[0]) and _is_number(pt[1])):
            raise ValueError("Invalid GeoJSON LineString coordinates")
        parts.append(f"{float(pt[0])} {float(pt[1])}")
    return WKTElement(f"LINESTRING({', '.join(parts)})", srid=srid)


def feature(
    *,
    id: str,
    geometry: dict[str, Any],
    properties: dict[str, Any],
    feature_type: Literal["Feature"] = "Feature",
) -> dict[str, Any]:
    return {"id": id, "type": feature_type, "geometry": geometry, "properties": properties}

