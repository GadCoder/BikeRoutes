import MapLibreGL from "@maplibre/maplibre-react-native";
import { useMemo, useRef, useState } from "react";

import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "@bikeroutes/shared";
import type { MapMarker } from "./MapCanvas";

import { LIMA_STYLE } from "../../map/limaStyle";

// Required once per app lifetime — no access token needed for self-hosted tiles.
MapLibreGL.setAccessToken(null as any);

function toLineFeature(g: GeoJSONLineStringGeometry): Feature<LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: g.coordinates as any },
  };
}

function toMarkerFeatures(markers: MapMarker[]): Feature<Point>[] {
  return markers.map((m) => ({
    type: "Feature",
    id: m.id,
    properties: { id: m.id, iconType: m.iconType, label: m.label ?? "" },
    geometry: { type: "Point", coordinates: m.coordinate as any },
  }));
}

function toVertexFeatures(line: GeoJSONLineStringGeometry): Feature<Point>[] {
  return line.coordinates.map((c, idx) => ({
    type: "Feature",
    id: String(idx),
    properties: { index: idx },
    geometry: { type: "Point", coordinates: c as any },
  }));
}

const DEFAULT_ZOOM = 12;

export function MapLibreMap(props: {
  geometry: GeoJSONLineStringGeometry;
  markers?: MapMarker[];
  onPressCoordinate?: (pos: GeoJSONPosition) => void;
  controlsEnabled?: boolean;
}) {
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const [currentZoom, setCurrentZoom] = useState<number | null>(null);

  const center = useMemo((): GeoJSONPosition => {
    const coords = props.geometry.coordinates;
    if (coords.length > 0) return coords[coords.length - 1]!;
    // Lima
    return [-77.0428, -12.0464];
  }, [props.geometry.coordinates]);

  const hasLine = props.geometry.coordinates.length >= 2;

  const lineFC: FeatureCollection<LineString> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: hasLine ? [toLineFeature(props.geometry)] : [],
    }),
    [props.geometry, hasLine],
  );

  const vertexFC: FeatureCollection<Point> = useMemo(
    () => ({ type: "FeatureCollection", features: toVertexFeatures(props.geometry) }),
    [props.geometry],
  );

  const markerFC: FeatureCollection<Point> = useMemo(
    () => ({ type: "FeatureCollection", features: toMarkerFeatures(props.markers ?? []) }),
    [props.markers],
  );

  return (
    <MapLibreGL.MapView
      mapStyle={JSON.stringify(LIMA_STYLE)}
      style={{ flex: 1 }}
      logoEnabled={false}
      attributionEnabled={false}
      onPress={(e) => {
        if (!props.controlsEnabled) return;
        const coords = e?.geometry?.coordinates as any;
        if (!coords || coords.length < 2) return;
        props.onPressCoordinate?.([coords[0], coords[1]]);
      }}
    >
      <MapLibreGL.Camera
        ref={cameraRef}
        centerCoordinate={center as any}
        zoomLevel={currentZoom ?? DEFAULT_ZOOM}
        animationDuration={0}
        onUserTrackingModeChange={(e) => {
          // Track zoom changes from user gestures
          const newZoom = e?.nativeEvent?.payload?.zoomLevel;
          if (typeof newZoom === 'number') {
            setCurrentZoom(newZoom);
          }
        }}
      />

      {/* Route line */}
      <MapLibreGL.ShapeSource id="route-line-src" shape={lineFC as any}>
        <MapLibreGL.LineLayer
          id="route-line-lyr"
          style={{ lineColor: "#0ea5a5", lineWidth: 4, lineCap: "round", lineJoin: "round" }}
        />
      </MapLibreGL.ShapeSource>

      {/* Vertices */}
      <MapLibreGL.ShapeSource id="route-verts-src" shape={vertexFC as any}>
        <MapLibreGL.CircleLayer
          id="route-verts-lyr"
          style={{ circleRadius: 5, circleColor: "#ffffff", circleStrokeWidth: 2, circleStrokeColor: "#0ea5a5" }}
        />
      </MapLibreGL.ShapeSource>

      {/* Markers */}
      <MapLibreGL.ShapeSource id="route-markers-src" shape={markerFC as any}>
        <MapLibreGL.CircleLayer
          id="route-markers-lyr"
          style={{ circleRadius: 7, circleColor: "#111827", circleStrokeWidth: 2, circleStrokeColor: "#ffffff" }}
        />
      </MapLibreGL.ShapeSource>
    </MapLibreGL.MapView>
  );
}
