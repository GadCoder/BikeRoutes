import { useState, useEffect } from "react";
import { useAuthStore } from "./stores";
import { useRoutesStore } from "./stores";
import { AuthScreen } from "./features/auth/AuthScreen";
import { RoutesList, RouteDetail } from "./features/routes";
import { RouteEditor } from "./features/editor";
import type { GeoJSONLineStringGeometry } from "@bikeroutes/shared";

type View =
  | { kind: "auth" }
  | { kind: "list" }
  | { kind: "detail"; routeId: string }
  | { kind: "editor"; routeId?: string };

export default function App() {
  const [view, setView] = useState<View>({ kind: "auth" });
  const { session, logout, initialize, isInitialized } = useAuthStore();
  const { deleteRoute } = useRoutesStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Redirect to list when authenticated
  useEffect(() => {
    if (session && view.kind === "auth") {
      setView({ kind: "list" });
    }
  }, [session, view.kind]);

  // Redirect to auth when logged out
  useEffect(() => {
    if (!session && view.kind !== "auth") {
      setView({ kind: "auth" });
    }
  }, [session, view.kind]);

  const handleLogout = () => {
    logout();
    setView({ kind: "auth" });
  };

  const handleRouteCreated = () => {
    setView({ kind: "list" });
  };

  const handleRouteDeleted = async (id: string) => {
    await deleteRoute(id);
    setView({ kind: "list" });
  };

  if (!isInitialized) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Restoring session...
      </div>
    );
  }

  // Render current view
  if (view.kind === "auth") {
    return <AuthScreen />;
  }

  if (view.kind === "list") {
    return (
      <div className="app">
        <header>
          <h1>BikeRoutes</h1>
          <button onClick={handleLogout}>Logout</button>
        </header>
        <RoutesList
          onSelectRoute={(id) => setView({ kind: "detail", routeId: id })}
          onCreateRoute={() => setView({ kind: "editor" })}
        />
      </div>
    );
  }

  if (view.kind === "detail") {
    return (
      <div className="app">
        <header>
          <button onClick={() => setView({ kind: "list" })}>← Back</button>
          <button onClick={handleLogout}>Logout</button>
        </header>
        <RouteDetail
          routeId={view.routeId}
          onBack={() => setView({ kind: "list" })}
          onEdit={() => setView({ kind: "editor", routeId: view.routeId })}
          onDelete={() => handleRouteDeleted(view.routeId)}
        />
      </div>
    );
  }

  if (view.kind === "editor") {
    return (
      <div className="app">
        <RouteEditor
          onSave={handleRouteCreated}
          onCancel={() => setView(view.routeId ? { kind: "detail", routeId: view.routeId } : { kind: "list" })}
        />
      </div>
    );
  }

  return null;
}
