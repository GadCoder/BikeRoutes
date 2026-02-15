// Metro requires JSON files using require, not ES6 import
const BASE_STYLE = require("@bikeroutes/shared/map/style.base.json");

export type MapStyle = any;

/**
 * Mobile-specific layer overrides to protect performance on devices.
 * Base style already has premium optimizations; these are mobile-specific tweaks.
 */
const MOBILE_LAYER_OVERRIDES: Record<string, any> = {
  // Place labels - prevent overlap on small screens
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
