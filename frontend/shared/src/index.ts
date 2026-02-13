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

export type GeoJSONFeature<
  G extends GeoJSONGeometry = GeoJSONGeometry,
  P extends Record<string, unknown> = Record<string, unknown>,
> = {
  id: string;
  type: "Feature";
  geometry: G;
  properties: P;
};

export function isGeoJSONLineStringGeometry(g: GeoJSONGeometry): g is GeoJSONLineStringGeometry {
  return g.type === "LineString";
}
