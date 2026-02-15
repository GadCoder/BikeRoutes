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
export async function login(email: string, password: string): Promise<Session> {
  return client.request<Session>("/auth/login", { method: "POST", json: { email, password } });
}

export async function register(email: string, password: string): Promise<Session> {
  return client.request<Session>("/auth/register", { method: "POST", json: { email, password } });
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
  login,
  register,
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
} as const;

export { ApiError };
