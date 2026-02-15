export class ApiError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, args: { status: number; bodyText: string }) {
    super(message);
    this.status = args.status;
    this.bodyText = args.bodyText;
  }
}

export interface Route {
  id: string;
  title: string;
  description?: string;
  geometry: GeoJSON.LineString;
  distance_km: number;
  is_public: boolean;
  markers: Marker[];
  created_at: string;
  updated_at: string;
}

export interface Marker {
  id: string;
  geometry: GeoJSON.Point;
  label?: string;
  description?: string;
  icon_type: string;
  order_index: number;
}

export interface User {
  id: string;
  email: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}
