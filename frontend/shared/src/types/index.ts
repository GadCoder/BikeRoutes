// GeoJSON types
export type LonLat = {
  lon: number;
  lat: number;
};

export type GeoJSONPosition = [number, number]; // [lon, lat]

export type GeoJSONPointGeometry = {
  type: "Point";
  coordinates: GeoJSONPosition;
};

export type GeoJSONLineStringGeometry = {
  type: "LineString";
  coordinates: GeoJSONPosition[];
};

export type GeoJSONGeometry = GeoJSONPointGeometry | GeoJSONLineStringGeometry;

export interface GeoJSONFeature<
  G extends GeoJSONGeometry = GeoJSONGeometry,
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: "Feature";
  geometry: G;
  properties: P;
}

export function isGeoJSONLineStringGeometry(g: GeoJSONGeometry): g is GeoJSONLineStringGeometry {
  return g.type === "LineString";
}

// API Types
export interface User {
  id: string;
  email: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

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
  geometry: GeoJSONPointGeometry;
  label?: string;
  description?: string;
  icon_type: string;
  order_index: number;
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
