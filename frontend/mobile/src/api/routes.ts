import { apiFetch } from "./http";
import type { GeoJSONLineStringGeometry, GeoJSONPointGeometry } from "@bikeroutes/shared";
import type { Route, Marker } from "@bikeroutes/shared";

export type { Route, Marker };

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

export interface CreateMarkerRequest {
  geometry: GeoJSONPointGeometry;
  label?: string;
  description?: string;
  icon_type?: string;
  order_index?: number;
}

export interface UpdateMarkerRequest {
  geometry?: GeoJSONPointGeometry;
  label?: string;
  description?: string;
  icon_type?: string;
  order_index?: number;
}

export async function apiCreateMarker(accessToken: string, routeId: string, data: CreateMarkerRequest): Promise<Marker> {
  return apiFetch<Marker>(`/routes/${routeId}/markers`, { method: "POST", accessToken, json: data });
}

export async function apiUpdateMarker(
  accessToken: string,
  routeId: string,
  markerId: string,
  data: UpdateMarkerRequest,
): Promise<Marker> {
  return apiFetch<Marker>(`/routes/${routeId}/markers/${markerId}`, { method: "PUT", accessToken, json: data });
}

export async function apiDeleteMarker(accessToken: string, routeId: string, markerId: string): Promise<void> {
  return apiFetch<void>(`/routes/${routeId}/markers/${markerId}`, { method: "DELETE", accessToken });
}

// Convenience wrappers used by route screens/editor (object-arg style).
export function listRoutes(args: { accessToken: string }): Promise<Route[]> {
  return apiListRoutes(args.accessToken);
}

export function getRoute(args: { accessToken: string; routeId: string }): Promise<Route> {
  return apiGetRoute(args.accessToken, args.routeId);
}

export function createRoute(args: {
  accessToken: string;
  title: string;
  description?: string;
  geometry: GeoJSONLineStringGeometry;
  isPublic?: boolean;
}): Promise<Route> {
  return apiCreateRoute(args.accessToken, {
    title: args.title,
    description: args.description,
    geometry: args.geometry,
    is_public: args.isPublic ?? false,
  });
}

export function updateRoute(args: {
  accessToken: string;
  routeId: string;
  title?: string;
  description?: string;
  geometry?: GeoJSONLineStringGeometry;
  isPublic?: boolean;
}): Promise<Route> {
  // Backend currently uses PUT for partial update; keep payload sparse.
  const payload: Partial<CreateRouteRequest> = {};
  if (args.title !== undefined) payload.title = args.title;
  if (args.description !== undefined) payload.description = args.description;
  if (args.geometry !== undefined) payload.geometry = args.geometry;
  if (args.isPublic !== undefined) payload.is_public = args.isPublic;
  return apiUpdateRoute(args.accessToken, args.routeId, payload);
}

export function deleteRoute(args: { accessToken: string; routeId: string }): Promise<void> {
  return apiDeleteRoute(args.accessToken, args.routeId);
}

export function createMarker(args: {
  accessToken: string;
  routeId: string;
  geometry: GeoJSONPointGeometry;
  label?: string;
  description?: string;
  iconType?: string;
  orderIndex?: number;
}): Promise<Marker> {
  return apiCreateMarker(args.accessToken, args.routeId, {
    geometry: args.geometry,
    label: args.label,
    description: args.description,
    icon_type: args.iconType,
    order_index: args.orderIndex,
  });
}

export function updateMarker(args: {
  accessToken: string;
  routeId: string;
  markerId: string;
  geometry?: GeoJSONPointGeometry;
  label?: string;
  description?: string;
  iconType?: string;
  orderIndex?: number;
}): Promise<Marker> {
  return apiUpdateMarker(args.accessToken, args.routeId, args.markerId, {
    geometry: args.geometry,
    label: args.label,
    description: args.description,
    icon_type: args.iconType,
    order_index: args.orderIndex,
  });
}
