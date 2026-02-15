import { useEffect } from "react";
import { useRoutesStore } from "../../stores/routesStore";

interface RouteDetailProps {
  routeId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RouteDetail({ routeId, onBack, onEdit, onDelete }: RouteDetailProps) {
  const { currentRoute, isLoading, fetchRoute } = useRoutesStore();

  useEffect(() => {
    fetchRoute(routeId);
  }, [routeId, fetchRoute]);

  if (isLoading || !currentRoute) {
    return <div className="loading">Loading route...</div>;
  }

  return (
    <div className="route-detail">
      <div className="route-detail-header">
        <button onClick={onBack}>← Back</button>
        <div className="actions">
          <button onClick={onEdit}>Edit</button>
          <button onClick={onDelete} className="danger">Delete</button>
        </div>
      </div>

      <h1>{currentRoute.title}</h1>
      {currentRoute.description && <p>{currentRoute.description}</p>}

      <div className="route-stats">
        <div>
          <label>Distance</label>
          <span>{currentRoute.distance_km.toFixed(1)} km</span>
        </div>
        <div>
          <label>Markers</label>
          <span>{currentRoute.markers.length}</span>
        </div>
      </div>

      {currentRoute.markers.length > 0 && (
        <div className="markers-list">
          <h3>Markers</h3>
          {currentRoute.markers.map((marker, index) => (
            <div key={marker.id} className="marker-item">
              <span className="marker-number">{index + 1}</span>
              <div>
                <strong>{marker.label || `Marker ${index + 1}`}</strong>
                {marker.description && <p>{marker.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
