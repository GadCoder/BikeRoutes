import { useEffect } from "react";
import { useRoutesStore } from "../../stores/routesStore";

interface RoutesListProps {
  onSelectRoute: (id: string) => void;
  onCreateRoute: () => void;
}

export function RoutesList({ onSelectRoute, onCreateRoute }: RoutesListProps) {
  const { routes, isLoading, error, fetchRoutes } = useRoutesStore();

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  if (isLoading && routes.length === 0) {
    return <div className="loading">Loading routes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (routes.length === 0) {
    return (
      <div className="empty-state">
        <p>No routes yet</p>
        <button onClick={onCreateRoute}>Create your first route</button>
      </div>
    );
  }

  return (
    <div className="routes-list">
      <div className="routes-header">
        <h2>My Routes</h2>
        <button onClick={onCreateRoute}>New Route</button>
      </div>
      
      <div className="routes-grid">
        {routes.map((route) => (
          <div
            key={route.id}
            className="route-card"
            onClick={() => onSelectRoute(route.id)}
          >
            <h3>{route.title}</h3>
            {route.description && <p>{route.description}</p>}
            <div className="route-meta">
              <span>{route.distance_km.toFixed(1)} km</span>
              <span>{route.markers.length} markers</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
