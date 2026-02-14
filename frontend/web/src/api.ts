import type { GeoJSONFeature, GeoJSONLineStringGeometry, GeoJSONPointGeometry } from "@bikeroutes/shared";

export type UserOut = { id: string; email: string };
export type SessionOut = { access_token: string; refresh_token: string; user: UserOut };

export type RouteFeature = GeoJSONFeature<GeoJSONLineStringGeometry>;
export type MarkerFeature = GeoJSONFeature<GeoJSONPointGeometry>;

function apiBaseUrl(): string {
  const env =
    (import.meta as any).env?.VITE_API_URL ??
    (import.meta as any).env?.VITE_API_BASE_URL ??
    "http://localhost:8000";
  return String(env).replace(/\/+$/, "") + "/api";
}

export class ApiError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, args: { status: number; bodyText: string }) {
    super(message);
    this.status = args.status;
    this.bodyText = args.bodyText;
  }
}

async function apiFetch<T>(
  path: string,
  args: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    accessToken?: string;
    json?: unknown;
  } = {},
): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: args.method ?? "GET",
    headers: {
      ...(args.json ? { "Content-Type": "application/json" } : {}),
      ...(args.accessToken ? { Authorization: `Bearer ${args.accessToken}` } : {}),
    },
    body: args.json ? JSON.stringify(args.json) : undefined,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new ApiError(`API ${res.status} for ${path}`, { status: res.status, bodyText });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function register(args: { email: string; password: string }): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/register", { method: "POST", json: args });
}

export async function login(args: { email: string; password: string }): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/login", { method: "POST", json: args });
}

export async function listRoutes(args: { accessToken: string }): Promise<RouteFeature[]> {
  return apiFetch<RouteFeature[]>("/routes", { accessToken: args.accessToken });
}

export async function getRoute(args: { accessToken?: string; routeId: string }): Promise<RouteFeature> {
  return apiFetch<RouteFeature>(`/routes/${args.routeId}`, { accessToken: args.accessToken });
}

export async function createRoute(args: {
  accessToken: string;
  title: string;
  description?: string | null;
  geometry: GeoJSONLineStringGeometry;
  is_public: boolean;
}): Promise<RouteFeature> {
  return apiFetch<RouteFeature>("/routes", {
    method: "POST",
    accessToken: args.accessToken,
    json: {
      title: args.title,
      description: args.description ?? null,
      geometry: args.geometry,
      is_public: args.is_public,
    },
  });
}

export async function updateRoute(args: {
  accessToken: string;
  routeId: string;
  title?: string;
  description?: string | null;
  geometry?: GeoJSONLineStringGeometry;
  is_public?: boolean;
}): Promise<RouteFeature> {
  return apiFetch<RouteFeature>(`/routes/${args.routeId}`, {
    method: "PUT",
    accessToken: args.accessToken,
    json: {
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.geometry !== undefined ? { geometry: args.geometry } : {}),
      ...(args.is_public !== undefined ? { is_public: args.is_public } : {}),
    },
  });
}

export async function deleteRoute(args: { accessToken: string; routeId: string }): Promise<void> {
  await apiFetch<void>(`/routes/${args.routeId}`, { method: "DELETE", accessToken: args.accessToken });
}

export async function getSharedRoute(args: { token: string }): Promise<RouteFeature> {
  return apiFetch<RouteFeature>(`/routes/share/${args.token}`);
}
