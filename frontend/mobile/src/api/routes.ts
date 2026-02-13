import type { GeoJSONGeometry } from "../../../shared/src";
import { apiFetch } from "./http";

export type MarkerFeature = {
  id: string;
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: {
    label?: string | null;
    description?: string | null;
    icon_type?: string | null;
    order_index?: number | null;
    [k: string]: unknown;
  };
};

export type RouteFeature = {
  id: string;
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: {
    title?: string | null;
    description?: string | null;
    distance_km?: number | null;
    is_public?: boolean | null;
    markers?: MarkerFeature[] | null;
    [k: string]: unknown;
  };
};

export async function listRoutes(args: { accessToken?: string; q?: string }): Promise<RouteFeature[]> {
  return apiFetch<RouteFeature[]>("/routes", {
    method: "GET",
    accessToken: args.accessToken,
    query: {
      q: args.q,
      page: 1,
      page_size: 50,
      sort: "updated_at",
      order: "desc",
    },
  });
}

export async function getRoute(args: { accessToken?: string; routeId: string }): Promise<RouteFeature> {
  return apiFetch<RouteFeature>(`/routes/${encodeURIComponent(args.routeId)}`, {
    method: "GET",
    accessToken: args.accessToken,
  });
}

export async function createRoute(args: {
  accessToken: string;
  title: string;
  description?: string;
  geometry: GeoJSONGeometry;
}): Promise<RouteFeature> {
  return apiFetch<RouteFeature>("/routes", {
    method: "POST",
    accessToken: args.accessToken,
    json: { title: args.title, description: args.description ?? null, geometry: args.geometry, is_public: false },
  });
}

export async function updateRoute(args: {
  accessToken: string;
  routeId: string;
  title?: string;
  description?: string;
  geometry?: GeoJSONGeometry;
}): Promise<RouteFeature> {
  return apiFetch<RouteFeature>(`/routes/${encodeURIComponent(args.routeId)}`, {
    method: "PUT",
    accessToken: args.accessToken,
    json: {
      title: args.title,
      description: args.description,
      geometry: args.geometry,
    },
  });
}

export async function deleteRoute(args: { accessToken: string; routeId: string }): Promise<void> {
  await apiFetch<void>(`/routes/${encodeURIComponent(args.routeId)}`, {
    method: "DELETE",
    accessToken: args.accessToken,
  });
}

export async function createMarker(args: {
  accessToken: string;
  routeId: string;
  geometry: GeoJSONGeometry;
  label?: string;
  description?: string;
  iconType: string;
  orderIndex: number;
}): Promise<MarkerFeature> {
  return apiFetch<MarkerFeature>(`/routes/${encodeURIComponent(args.routeId)}/markers`, {
    method: "POST",
    accessToken: args.accessToken,
    json: {
      geometry: args.geometry,
      label: args.label ?? null,
      description: args.description ?? null,
      icon_type: args.iconType,
      order_index: args.orderIndex,
    },
  });
}

export async function updateMarker(args: {
  accessToken: string;
  routeId: string;
  markerId: string;
  geometry?: GeoJSONGeometry;
  label?: string;
  description?: string;
  iconType?: string;
  orderIndex?: number;
}): Promise<MarkerFeature> {
  return apiFetch<MarkerFeature>(`/routes/${encodeURIComponent(args.routeId)}/markers/${encodeURIComponent(args.markerId)}`, {
    method: "PUT",
    accessToken: args.accessToken,
    json: {
      geometry: args.geometry,
      label: args.label,
      description: args.description,
      icon_type: args.iconType,
      order_index: args.orderIndex,
    },
  });
}

