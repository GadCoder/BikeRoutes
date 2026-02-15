import { useState, useRef, useEffect } from "react";
import type {
  GeoJSONLineStringGeometry,
  GeoJSONPointGeometry,
  GeoJSONPosition,
} from "@bikeroutes/shared";
import { createWebMap, type WebMapHandle } from "../../webMap";

interface RouteEditorProps {
  initialGeometry?: GeoJSONLineStringGeometry;
  initialMarkers?: GeoJSONPointGeometry[];
  onSave: (data: {
    title: string;
    description: string;
    geometry: GeoJSONLineStringGeometry;
    markers: GeoJSONPointGeometry[];
  }) => void;
  onCancel: () => void;
}

// History management for undo/redo
type History<T> = { past: T[]; present: T; future: T[] };

function historyInit<T>(t: T): History<T> {
  return { past: [], present: t, future: [] };
}

function historyPush<T>(h: History<T>, next: T): History<T> {
  return { past: [...h.past, h.present], present: next, future: [] };
}

function historyUndo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  const prev = h.past[h.past.length - 1];
  return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] };
}

function historyRedo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  const next = h.future[0];
  return { past: [...h.past, h.present], present: next, future: h.future.slice(1) };
}

function emptyLine(): GeoJSONLineStringGeometry {
  return { type: "LineString", coordinates: [] };
}

export function RouteEditor({ initialGeometry, initialMarkers, onSave, onCancel }: RouteEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const webMapRef = useRef<WebMapHandle | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState(() => 
    historyInit<{ geometry: GeoJSONLineStringGeometry; markers: GeoJSONPointGeometry[] }>({
      geometry: initialGeometry || emptyLine(),
      markers: initialMarkers || [],
    })
  );

  const { geometry, markers } = history.present;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    webMapRef.current = createWebMap({
      container: mapRef.current,
      center: [-77.0428, -12.0464],
      zoom: 12,
      onMapClick: (e) => {
        const pos: GeoJSONPosition = [e.lngLat.lng, e.lngLat.lat];
        setHistory((h) =>
          historyPush(h, {
            geometry: {
              ...h.present.geometry,
              coordinates: [...h.present.geometry.coordinates, pos],
            },
            markers: h.present.markers,
          }),
        );
      },
      onVertexDrag: ({ index, lngLat }) => {
        // Drag updates are frequent; update the present state without pushing to history.
        setHistory((h) => {
          const coords = h.present.geometry.coordinates.slice();
          coords[index] = lngLat;
          return {
            ...h,
            present: {
              ...h.present,
              geometry: { ...h.present.geometry, coordinates: coords },
            },
          };
        });
      },
    });

    return () => {
      webMapRef.current?.map.remove();
      webMapRef.current = null;
    };
  }, []);

  // Update map when geometry/markers change
  useEffect(() => {
    webMapRef.current?.setLine(geometry);
    webMapRef.current?.setMarkers(markers);
  }, [geometry, markers]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleUndo = () => setHistory(historyUndo);
  const handleRedo = () => setHistory(historyRedo);

  const handleSave = () => {
    onSave({ title, description, geometry, markers });
  };

  const distanceKm = geometry.coordinates.length > 1
    ? calculateDistance(geometry.coordinates)
    : 0;

  return (
    <div className="route-editor">
      <div className="editor-sidebar">
        <div className="editor-header">
          <button onClick={onCancel}>Cancel</button>
          <div className="history-controls">
            <button onClick={handleUndo} disabled={!canUndo}>Undo</button>
            <button onClick={handleRedo} disabled={!canRedo}>Redo</button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Route title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="editor-stats">
          <div>
            <label>Distance</label>
            <span>{distanceKm.toFixed(1)} km</span>
          </div>
          <div>
            <label>Points</label>
            <span>{geometry.coordinates.length}</span>
          </div>
        </div>

        <button 
          className="save-button" 
          onClick={handleSave}
          disabled={!title || geometry.coordinates.length < 2}
        >
          Save Route
        </button>
      </div>

      <div 
        ref={mapRef} 
        className="editor-map"
      />
    </div>
  );
}

function calculateDistance(coords: GeoJSONPosition[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1], coords[i]);
  }
  return total;
}

function haversineDistance(a: GeoJSONPosition, b: GeoJSONPosition): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const c = 2 * Math.atan2(
    Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon),
    Math.sqrt(1 - sinDLat * sinDLat - Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)
  );

  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
