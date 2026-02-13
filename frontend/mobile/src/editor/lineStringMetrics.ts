import type { GeoJSONLineStringGeometry } from "../../../shared/src";
import { haversineMeters } from "./haversine";

export function lineStringDistanceMeters(g: GeoJSONLineStringGeometry): number {
  let total = 0;
  for (let i = 1; i < g.coordinates.length; i++) {
    total += haversineMeters(g.coordinates[i - 1]!, g.coordinates[i]!);
  }
  return total;
}

export function lineStringVertexCount(g: GeoJSONLineStringGeometry): number {
  return g.coordinates.length;
}

export function formatDistanceKm(meters: number): string {
  const km = meters / 1000;
  if (!Number.isFinite(km)) return "0.0 km";
  const rounded = Math.round(km * 10) / 10;
  return `${rounded.toFixed(1)} km`;
}

export function formatVertices(count: number): string {
  return `${count} pts`;
}

