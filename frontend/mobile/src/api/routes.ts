import { apiBaseUrl } from "./config";
import { apiFetch } from "./http";
import type { GeoJSONLineStringGeometry } from "@bikeroutes/shared";

export interface Route {
  id: string;
  title: string;
  description?: string;
  geometry: GeoJSONLineStringGeometry;
  distance_km: number;
  is_public: boolean;
  markers: Marker[];
  created_at: string;
  updated_at: string;
}

export interface Marker {
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  label?: string;
  description?: string;
  icon_type: string;
  order_index: number;
}

export interface CreateRouteRequest {
  title: string;
  description?: string;
  geometry: GeoJSONLineStringGeometry;
  is_public?: boolean;
}

export async function apiListRoutes(accessToken: string): Promise<Route[]> {
  return apiFetch<Route[]>("/routes", { accessToken });
}

export async function apiGetRoute(accessToken: string, id: string): Promise<Route> {
  return apiFetch<Route>(`/routes/${id}`, { accessToken });
}

export async function apiCreateRoute(accessToken: string, data: CreateRouteRequest): Promise<Route> {
  return apiFetch<Route>("/routes", { method: "POST", accessToken, json: data });
}

export async function apiUpdateRoute(
  accessToken: string, 
  id: string, 
  data: Partial<CreateRouteRequest>
): Promise<Route> {
  return apiFetch<Route>(`/routes/${id}`, { method: "PUT", accessToken, json: data });
}

export async function apiDeleteRoute(accessToken: string, id: string): Promise<void> {
  return apiFetch<void>(`/routes/${id}`, { method: "DELETE", accessToken });
}
