import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONLineStringGeometry, GeoJSONPointGeometry, GeoJSONPosition } from "@bikeroutes/shared";
import { ApiError, createRoute, deleteRoute, getRoute, getSharedRoute, listRoutes, login, register, updateRoute } from "./api";
import { Button, Card, Modal, TextField } from "./components";
import { clearSession, getAccessToken, setSession } from "./session";
import { createWebMap, type WebMapHandle } from "./webMap";

const DEFAULT_CENTER: [number, number] = [-77.0428, -12.0464]; // Lima
const DEFAULT_ZOOM = 12;

type View =
  | { kind: "auth" }
  | { kind: "list" }
  | { kind: "editor"; routeId?: string; sharedToken?: string };

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

function formatErr(e: unknown): string {
  if (e instanceof ApiError) return `${e.message}\n${e.bodyText}`.trim();
  if (e instanceof Error) return e.message;
  return String(e);
}

function isApi401(e: unknown): boolean {
  return e instanceof ApiError && e.status === 401;
}

export default function App() {
  const [view, setView] = useState<View>({ kind: getAccessToken() ? "list" : "auth" });

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);

  // List
  const [routes, setRoutes] = useState<any[]>([]);
  const [listBusy, setListBusy] = useState(false);

  // Editor state
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapHandleRef = useRef<WebMapHandle | null>(null);

  const [lineHist, setLineHist] = useState(() => historyInit(emptyLine()));
  const [markers, setMarkers] = useState<GeoJSONPointGeometry[]>([]);
  const [editorMode, setEditorMode] = useState<"draw" | "marker">("draw");

  const [routeTitle, setRouteTitle] = useState("Untitled Route");
  const [routeNotes, setRouteNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTokenInput, setShareTokenInput] = useState("");

  const accessToken = getAccessToken();

  async function authed<T>(fn: (token: string) => Promise<T>): Promise<T> {
    const tok = getAccessToken();
    if (!tok) throw new Error("Not signed in");
    try {
      return await fn(tok);
    } catch (e) {
      if (isApi401(e)) {
        clearSession();
        setView({ kind: "auth" });
      }
      throw e;
    }
  }

  async function refreshList() {
    if (!accessToken) return;
    setListBusy(true);
    try {
      const r = await authed((t) => listRoutes({ accessToken: t }));
      setRoutes(r);
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setListBusy(false);
    }
  }

  useEffect(() => {
    if (view.kind === "list") void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.kind]);

  useEffect(() => {
    if (view.kind !== "editor") return;
    if (!mapDivRef.current) return;
    if (mapHandleRef.current) return;

    const handle = createWebMap({
      container: mapDivRef.current,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      onMapClick: (e) => {
        const pos: GeoJSONPosition = [e.lngLat.lng, e.lngLat.lat];
        if (editorMode === "marker") {
          setMarkers((ms) => [...ms, { type: "Point", coordinates: pos }]);
          return;
        }

        setLineHist((h) => {
          const next: GeoJSONLineStringGeometry = {
            type: "LineString",
            coordinates: [...h.present.coordinates, pos],
          };
          return historyPush(h, next);
        });
      },
      onVertexDrag: ({ index, lngLat }) => {
        setLineHist((h) => {
          if (index < 0 || index >= h.present.coordinates.length) return h;
          const coords = [...h.present.coordinates];
          coords[index] = lngLat;
          return historyPush(h, { type: "LineString", coordinates: coords });
        });
      },
    });

    mapHandleRef.current = handle;

    return () => {
      handle.map.remove();
      mapHandleRef.current = null;
    };
  }, [view.kind, editorMode]);

  // Sync map when state changes
  useEffect(() => {
    if (view.kind !== "editor") return;
    mapHandleRef.current?.setLine(lineHist.present);
  }, [view.kind, lineHist.present]);

  useEffect(() => {
    if (view.kind !== "editor") return;
    mapHandleRef.current?.setMarkers(markers);
  }, [view.kind, markers]);

  async function startCreate() {
    setLineHist(historyInit(emptyLine()));
    setMarkers([]);
    setRouteTitle("Untitled Route");
    setRouteNotes("");
    setIsPublic(false);
    setShareToken(null);
    setView({ kind: "editor" });
  }

  async function openExisting(routeId: string) {
    setBusy(true);
    try {
      const feat = await authed((t) => getRoute({ accessToken: t, routeId }));
      setLineHist(historyInit(feat.geometry as any));
      setRouteTitle(String((feat.properties as any)?.title ?? "Untitled Route"));
      setRouteNotes(String((feat.properties as any)?.description ?? ""));
      setIsPublic(Boolean((feat.properties as any)?.is_public));
      setShareToken(((feat.properties as any)?.share_token as string | undefined) ?? null);
      // markers come as an array of objects; for now only store point geometries.
      const ms = Array.isArray((feat.properties as any)?.markers)
        ? (feat.properties as any).markers
            .map((m: any) => m?.geometry)
            .filter((g: any) => g?.type === "Point")
        : [];
      setMarkers(ms);
      setView({ kind: "editor", routeId });
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function openShared() {
    const token = shareTokenInput.trim();
    if (!token) return;
    setBusy(true);
    try {
      const feat = await getSharedRoute({ token });
      setLineHist(historyInit(feat.geometry as any));
      setRouteTitle(String((feat.properties as any)?.title ?? "Shared Route"));
      setRouteNotes(String((feat.properties as any)?.description ?? ""));
      setIsPublic(Boolean((feat.properties as any)?.is_public));
      setShareToken(null);
      setMarkers([]);
      setView({ kind: "editor", sharedToken: token });
      setShareOpen(false);
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveRoute() {
    if (view.kind !== "editor") return;
    if (!routeTitle.trim()) {
      alert("Route title is required");
      return;
    }
    if (lineHist.present.coordinates.length < 2) {
      alert("Draw at least 2 points");
      return;
    }

    setBusy(true);
    try {
      if (view.routeId) {
        const updated = await authed((t) =>
          updateRoute({
            accessToken: t,
            routeId: view.routeId!,
            title: routeTitle.trim(),
            description: routeNotes.trim() || null,
            geometry: lineHist.present,
            is_public: isPublic,
          }),
        );
        setShareToken(((updated.properties as any)?.share_token as string | undefined) ?? null);
      } else {
        const created = await authed((t) =>
          createRoute({
            accessToken: t,
            title: routeTitle.trim(),
            description: routeNotes.trim() || null,
            geometry: lineHist.present,
            is_public: isPublic,
          }),
        );
        setShareToken(((created.properties as any)?.share_token as string | undefined) ?? null);
        setView({ kind: "editor", routeId: created.id });
      }
      setSaveOpen(false);
      await refreshList();
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function doDeleteRoute(routeId: string) {
    if (!confirm("Delete this route?")) return;
    setBusy(true);
    try {
      await authed((t) => deleteRoute({ accessToken: t, routeId }));
      await refreshList();
    } catch (e) {
      alert(formatErr(e));
    } finally {
      setBusy(false);
    }
  }

  const canUndo = lineHist.past.length > 0;
  const canRedo = lineHist.future.length > 0;

  if (view.kind === "auth") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, fontFamily: "system-ui" }}>
        <div style={{ width: 420, maxWidth: "100%" }}>
          <h1 style={{ margin: 0 }}>BikeRoutes</h1>
          <p style={{ opacity: 0.7, marginTop: 6 }}>Sign in to access your routes.</p>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <TextField label="Email" value={email} onChange={setEmail} />
            <TextField label="Password" value={password} onChange={setPassword} type="password" />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                label={authMode === "login" ? "Sign In" : "Create Account"}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const s = authMode === "login" ? await login({ email, password }) : await register({ email, password });
                    setSession(s);
                    setView({ kind: "list" });
                  } catch (e) {
                    alert(formatErr(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <Button
                variant="secondary"
                label={authMode === "login" ? "Need an account?" : "Already have an account?"}
                onClick={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}
              />
              <Button variant="secondary" label="Open shared route" onClick={() => setShareOpen(true)} />
            </div>

            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              API URL via VITE_API_URL (defaults to http://localhost:8000).
            </p>
          </div>
        </div>

        <Modal open={shareOpen} title="Open shared route" onClose={() => setShareOpen(false)}>
          <div style={{ display: "grid", gap: 10 }}>
            <TextField label="Share token" value={shareTokenInput} onChange={setShareTokenInput} />
            <div style={{ display: "flex", gap: 10 }}>
              <Button label="Open" onClick={openShared} />
              <Button variant="secondary" label="Cancel" onClick={() => setShareOpen(false)} />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (view.kind === "list") {
    return (
      <div style={{ minHeight: "100vh", padding: 16, fontFamily: "system-ui", background: "#f8fafc" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 12 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0 }}>My Routes</h1>
              <p style={{ margin: "6px 0 0", opacity: 0.65, fontSize: 13 }}>Web parity work (OpenSpec 4.5)</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button label="+ New Route" onClick={startCreate} />
              <Button variant="secondary" label={listBusy ? "Refreshing..." : "Refresh"} onClick={refreshList} />
              <Button
                variant="secondary"
                label="Sign out"
                onClick={() => {
                  clearSession();
                  setView({ kind: "auth" });
                }}
              />
            </div>
          </header>

          {routes.length === 0 ? (
            <Card>
              <div style={{ opacity: 0.7 }}>No routes yet.</div>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {routes.map((r) => (
                <Card key={r.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{String((r.properties as any)?.title ?? r.id)}</div>
                      <div style={{ opacity: 0.65, fontSize: 13, marginTop: 4 }}>
                        {(r.properties as any)?.distance_km?.toFixed?.(2) ?? "?"} km · {(r.properties as any)?.is_public ? "Public" : "Private"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Button variant="secondary" label="Edit" onClick={() => openExisting(r.id)} />
                      <Button variant="secondary" label="Delete" onClick={() => doDeleteRoute(r.id)} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // editor
  const sharedReadOnly = Boolean(view.sharedToken);
  const shareUrl = shareToken ? `${location.origin}/?share=${encodeURIComponent(shareToken)}` : null;

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr", fontFamily: "system-ui" }}>
      <header
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <strong>Editor</strong>
          <span style={{ opacity: 0.65, fontSize: 13 }}>{sharedReadOnly ? "Shared (read-only)" : routeTitle}</span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="secondary" label={editorMode === "draw" ? "Mode: Draw" : "Mode: Marker"} onClick={() => setEditorMode((m) => (m === "draw" ? "marker" : "draw"))} />
          <Button variant="secondary" label="Undo" disabled={!canUndo || sharedReadOnly} onClick={() => setLineHist((h) => historyUndo(h))} />
          <Button variant="secondary" label="Redo" disabled={!canRedo || sharedReadOnly} onClick={() => setLineHist((h) => historyRedo(h))} />
          <Button variant="secondary" label="Fit" onClick={() => mapHandleRef.current?.fitToLine()} />
          <Button variant="secondary" label="My Routes" onClick={() => setView({ kind: accessToken ? "list" : "auth" })} />
          <Button label="Save" disabled={busy || sharedReadOnly} onClick={() => setSaveOpen(true)} />
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0 }}>
        <div ref={mapDivRef} style={{ minHeight: 0, height: "100%", width: "100%" }} />

        <aside style={{ borderLeft: "1px solid rgba(0,0,0,0.08)", padding: 12, background: "#fff", overflow: "auto" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <div style={{ display: "grid", gap: 10 }}>
                <strong>Route</strong>
                <TextField label="Title" value={routeTitle} onChange={setRouteTitle} />
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <span style={{ opacity: 0.8 }}>Notes</span>
                  <textarea
                    value={routeNotes}
                    onChange={(e) => setRouteNotes(e.target.value)}
                    rows={5}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)", fontSize: 14, resize: "vertical" }}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} disabled={sharedReadOnly} />
                  Public
                </label>
              </div>
            </Card>

            <Card>
              <div style={{ display: "grid", gap: 10 }}>
                <strong>Sharing</strong>
                {shareToken ? (
                  <>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>Share token</div>
                    <code style={{ fontSize: 12, padding: 8, borderRadius: 10, background: "rgba(0,0,0,0.06)" }}>{shareToken}</code>
                    {shareUrl ? (
                      <>
                        <div style={{ fontSize: 13, opacity: 0.7 }}>Share URL</div>
                        <input value={shareUrl} readOnly style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }} />
                      </>
                    ) : null}
                    <Button
                      variant="secondary"
                      label="Copy URL"
                      onClick={() => {
                        if (!shareUrl) return;
                        void navigator.clipboard.writeText(shareUrl);
                        alert("Copied");
                      }}
                    />
                  </>
                ) : (
                  <div style={{ opacity: 0.7, fontSize: 13 }}>
                    Make the route public and save to generate a share token.
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div style={{ display: "grid", gap: 10 }}>
                <strong>Markers</strong>
                <div style={{ opacity: 0.7, fontSize: 13 }}>
                  Marker placement is minimal: toggle Mode: Marker and click on the map.
                </div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Count: {markers.length}</div>
                <Button variant="secondary" label="Clear markers" disabled={sharedReadOnly} onClick={() => setMarkers([])} />
              </div>
            </Card>
          </div>
        </aside>
      </div>

      <Modal open={saveOpen} title="Save route" onClose={() => setSaveOpen(false)}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            This saves the route to the backend and (if public) generates a share token.
          </div>
          <Button label={busy ? "Saving..." : "Save"} disabled={busy || sharedReadOnly} onClick={saveRoute} />
        </div>
      </Modal>

      <Modal open={shareOpen} title="Open shared route" onClose={() => setShareOpen(false)}>
        <div style={{ display: "grid", gap: 10 }}>
          <TextField label="Share token" value={shareTokenInput} onChange={setShareTokenInput} />
          <div style={{ display: "flex", gap: 10 }}>
            <Button label="Open" onClick={openShared} />
            <Button variant="secondary" label="Cancel" onClick={() => setShareOpen(false)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
