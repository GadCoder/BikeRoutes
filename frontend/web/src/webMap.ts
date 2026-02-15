import maplibregl, {
  type Map,
  type MapMouseEvent,
  type LngLatLike,
} from "maplibre-gl";
import type {
  GeoJSONLineStringGeometry,
  GeoJSONPointGeometry,
  GeoJSONPosition,
} from "@bikeroutes/shared";
import BASE_STYLE from "@bikeroutes/shared/map/style.base.json";

export type WebMapHandle = {
  map: Map;
  setLine: (g: GeoJSONLineStringGeometry) => void;
  setMarkers: (g: GeoJSONPointGeometry[]) => void;
  fitToLine: () => void;
};

const LINE_SOURCE_ID = "route-line-src";
const LINE_LAYER_ID = "route-line-lyr";
const VERT_SOURCE_ID = "route-verts-src";
const VERT_LAYER_ID = "route-verts-lyr";
const MARKER_SOURCE_ID = "route-markers-src";
const MARKER_LAYER_ID = "route-markers-lyr";

export function createWebMap(args: {
  container: HTMLElement;
  center: LngLatLike;
  zoom: number;
  onMapClick: (e: MapMouseEvent) => void;
  onVertexDrag: (args: { index: number; lngLat: GeoJSONPosition }) => void;
}): WebMapHandle {
  const map = new maplibregl.Map({
    container: args.container,
    style: BASE_STYLE as any,
    center: args.center,
    zoom: args.zoom,
    maxZoom: 17,
  });
  (window as any).map = map; // for debugging

  map.addControl(
    new maplibregl.NavigationControl({ visualizePitch: true }),
    "top-right",
  );

  let line: GeoJSONLineStringGeometry = { type: "LineString", coordinates: [] };
  let markers: GeoJSONPointGeometry[] = [];

  function ensureSources() {
    if (!map.getSource(LINE_SOURCE_ID)) {
      map.addSource(LINE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: line },
      });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: LINE_SOURCE_ID,
        paint: {
          "line-color": "#0ea5a5",
          "line-width": 5,
        },
      });
    }

    if (!map.getSource(VERT_SOURCE_ID)) {
      map.addSource(VERT_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: line.coordinates.map((c, i) => ({
            type: "Feature",
            id: String(i),
            properties: { index: i },
            geometry: { type: "Point", coordinates: c },
          })),
        },
      });
      map.addLayer({
        id: VERT_LAYER_ID,
        type: "circle",
        source: VERT_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0ea5a5",
        },
      });
    }

    if (!map.getSource(MARKER_SOURCE_ID)) {
      map.addSource(MARKER_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: markers.map((m, i) => ({
            type: "Feature",
            id: String(i),
            properties: { index: i },
            geometry: m,
          })),
        },
      });
      map.addLayer({
        id: MARKER_LAYER_ID,
        type: "circle",
        source: MARKER_SOURCE_ID,
        paint: {
          "circle-radius": 7,
          "circle-color": "#111827",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }
  }

  function syncLine() {
    const src = map.getSource(LINE_SOURCE_ID) as any;
    if (src) {
      src.setData({ type: "Feature", properties: {}, geometry: line });
    }

    const vsrc = map.getSource(VERT_SOURCE_ID) as any;
    if (vsrc) {
      vsrc.setData({
        type: "FeatureCollection",
        features: line.coordinates.map((c, i) => ({
          type: "Feature",
          id: String(i),
          properties: { index: i },
          geometry: { type: "Point", coordinates: c },
        })),
      });
    }
  }

  function syncMarkers() {
    const src = map.getSource(MARKER_SOURCE_ID) as any;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: markers.map((m, i) => ({
        type: "Feature",
        id: String(i),
        properties: { index: i },
        geometry: m,
      })),
    });
  }

  let draggingIndex: number | null = null;

  map.on("load", () => {
    ensureSources();
    syncLine();
    syncMarkers();

    map.on("click", (e) => args.onMapClick(e));

    map.on("mouseenter", VERT_LAYER_ID, () => {
      map.getCanvas().style.cursor = "grab";
    });
    map.on("mouseleave", VERT_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mousedown", VERT_LAYER_ID, (e: any) => {
      if (!e.features?.length) return;
      draggingIndex = Number(e.features[0].properties?.index);
      map.getCanvas().style.cursor = "grabbing";
      map.dragPan.disable();
    });

    map.on("mousemove", (e) => {
      if (draggingIndex === null) return;
      const lngLat: GeoJSONPosition = [e.lngLat.lng, e.lngLat.lat];
      args.onVertexDrag({ index: draggingIndex, lngLat });
    });

    map.on("mouseup", () => {
      if (draggingIndex === null) return;
      draggingIndex = null;
      map.getCanvas().style.cursor = "";
      map.dragPan.enable();
    });
  });

  return {
    map,
    setLine(g) {
      line = g;
      syncLine();
    },
    setMarkers(gs) {
      markers = gs;
      syncMarkers();
    },
    fitToLine() {
      if (!line.coordinates.length) return;
      const lons = line.coordinates.map((c) => c[0]);
      const lats = line.coordinates.map((c) => c[1]);
      const minLng = Math.min(...lons);
      const maxLng = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 300 },
      );
    },
  };
}
