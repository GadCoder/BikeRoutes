import { useEffect, useRef } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const DEFAULT_CENTER: [number, number] = [-77.0428, -12.0464]; // Lima
const DEFAULT_ZOOM = 12;

export default function App() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <strong>BikeRoutes</strong>
        <span style={{ opacity: 0.65, fontSize: 13 }}>Web map baseline (OpenSpec 4.1)</span>
      </header>

      <div ref={mapDivRef} style={{ flex: 1 }} />
    </div>
  );
}

