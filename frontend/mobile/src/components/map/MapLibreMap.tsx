import MapLibreGL from "@maplibre/maplibre-react-native";
import { useEffect, useMemo } from "react";
import * as Location from "expo-location";
import { useRef } from "react";

import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "@bikeroutes/shared";
import type { MapMarker } from "./MapCanvas";

import { LIMA_STYLE } from "../../map/limaStyle";

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

export function MapLibreMap(props: {
  geometry: GeoJSONLineStringGeometry;
  markers?: MapMarker[];
  onPressCoordinate?: (pos: GeoJSONPosition) => void;
  controlsEnabled?: boolean;
  locateSignal?: number;
}) {
  // Required once per app start
  useEffect(() => {
    MapLibreGL.setAccessToken(null as any);
  }, []);

  useEffect(() => {
    if (!props.locateSignal) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        cameraRef.current?.setCamera({ centerCoordinate: lngLat as any, zoomLevel: 14, animationDuration: 500 });
      } catch {
        // ignore
      }
    })();
  }, [props.locateSignal]);

  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const center = useMemo((): GeoJSONPosition => {
    const coords = props.geometry.coordinates;
    if (coords.length > 0) return coords[coords.length - 1]!;
    // Lima
    return [-77.0428, -12.0464];
  }, [props.geometry.coordinates]);

  const lineFC: FeatureCollection<LineString> = useMemo(
    () => ({ type: "FeatureCollection", features: [toLineFeature(props.geometry)] }),
    [props.geometry],
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
      styleJSON={LIMA_STYLE}
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
        zoomLevel={12}
        animationDuration={0}
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
