import type { GeoJSONPosition } from "@bikeroutes/shared";

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: GeoJSONPosition, b: GeoJSONPosition): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(rLat1) * Math.cos(rLat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
