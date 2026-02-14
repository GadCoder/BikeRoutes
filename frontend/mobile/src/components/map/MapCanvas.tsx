import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "../../../../shared/src";
import { MapLibreMap } from "./MapLibreMap";

export type MapMarker = {
  id: string;
  coordinate: GeoJSONPosition;
  iconType: string;
  label?: string;
};

/**
 * Map canvas abstraction for the editor.
 * MVP uses an in-app stub implementation to avoid native map dependencies.
 * Swap this to a MapLibre-backed implementation when native integration is in place.
 */
export function MapCanvas(props: {
  geometry: GeoJSONLineStringGeometry;
  markers?: MapMarker[];
  onPressCoordinate?: (pos: GeoJSONPosition) => void;
  controlsEnabled?: boolean;
}) {
  return <MapLibreMap {...props} />;
}
