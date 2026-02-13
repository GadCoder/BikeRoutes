import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "../../../../shared/src";
import { StubMap } from "./StubMap";

/**
 * Map canvas abstraction for the editor.
 * MVP uses an in-app stub implementation to avoid native map dependencies.
 * Swap this to a MapLibre-backed implementation when native integration is in place.
 */
export function MapCanvas(props: {
  geometry: GeoJSONLineStringGeometry;
  onPressCoordinate?: (pos: GeoJSONPosition) => void;
  controlsEnabled?: boolean;
}) {
  return <StubMap {...props} />;
}

