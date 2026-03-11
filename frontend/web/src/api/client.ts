import { ApiClient as SharedApiClient, type ApiClientConfig } from "@bikeroutes/shared";
import { ApiError } from "@bikeroutes/shared";
import type { Session, User, Route } from "./types";

let globalToken: string | null = null;

export function setAccessToken(token: string | null) {
  globalToken = token;
}

const config: ApiClientConfig = {
  baseUrl: "/api",
  getToken: () => globalToken,
};

export const client = new SharedApiClient(config);
export { SharedApiClient as ApiClient };

// Auth API
export async function googleExchange(idToken: string): Promise<Session> {
  return client.request<Session>("/auth/google", { method: "POST", json: { id_token: idToken } });
}

export async function refresh(refreshToken: string): Promise<Session> {
  return client.request<Session>("/auth/refresh", {
    method: "POST",
    json: { refresh_token: refreshToken },
  });
}

export async function me(): Promise<User> {
  return client.request<User>("/auth/me");
}

// Routes API
export async function listRoutes(): Promise<Route[]> {
  return client.request<Route[]>("/routes");
}

export async function getRoute(id: string): Promise<Route> {
  return client.request<Route>(`/routes/${id}`);
}

export async function createRoute(data: any): Promise<Route> {
  return client.request<Route>("/routes", { method: "POST", json: data });
}

export async function updateRoute(id: string, data: any): Promise<Route> {
  return client.request<Route>(`/routes/${id}`, { method: "PUT", json: data });
}

export async function deleteRoute(id: string): Promise<void> {
  return client.request<void>(`/routes/${id}`, { method: "DELETE" });
}

// Legacy-friendly facade used by the stores/UI.
export const api = {
  setAccessToken,
  googleExchange,
  refresh,
  me,
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
} as const;

export { ApiError };
