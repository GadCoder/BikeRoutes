// Metro requires JSON files using require, not ES6 import
const BASE_STYLE = require("@bikeroutes/shared/map/style.base.json");

export type MapStyle = any;

/**
 * Mobile-specific layer overrides to protect performance on devices.
 * Increases minzoom for dense label layers and adjusts density.
 */
const MOBILE_LAYER_OVERRIDES: Record<string, any> = {
  // Reduce label density on mobile by pushing POI labels to higher zoom
  "poi-label": {
    minzoom: 15, // Base is 14, mobile waits until 15
  },
  // Place labels - keep allow-overlap false
  "place-label": {
    layout: {
      "text-allow-overlap": false,
    },
  },
};

function applyOverrides(style: any, overrides: Record<string, any>): any {
  return {
    ...style,
    layers: style.layers.map((layer: any) => {
      const layerOverrides = overrides[layer.id];
      if (!layerOverrides) return layer;

      return {
        ...layer,
        ...layerOverrides,
        layout: {
          ...layer.layout,
          ...layerOverrides.layout,
        },
        paint: {
          ...layer.paint,
          ...layerOverrides.paint,
        },
      };
    }),
  };
}

/**
 * Get the map style for mobile with platform-specific optimizations applied.
 * Uses the shared base style with overrides for performance on devices.
 */
export function getMobileStyle(): MapStyle {
  return applyOverrides(BASE_STYLE, MOBILE_LAYER_OVERRIDES);
}

/**
 * Raw base style if you need it without overrides.
 */
export { BASE_STYLE };
