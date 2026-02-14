export const LIMA_STYLE: any = {
  version: 8,
  name: "BikeRoutes Lima (mobile)",
  sources: {
    lima: {
      type: "vector",
      tiles: ["https://tiles-bikeroutes.gadcoder.com/data/lima/{z}/{x}/{y}.pbf"],
      minzoom: 0,
      maxzoom: 15,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#f8f8f8" } },

    // Landuse / parks
    {
      id: "landuse",
      type: "fill",
      source: "lima",
      "source-layer": "landuse",
      paint: { "fill-color": "#efefef" },
    },
    {
      id: "park",
      type: "fill",
      source: "lima",
      "source-layer": "park",
      paint: { "fill-color": "#d8f3dc" },
    },

    // Water
    {
      id: "water",
      type: "fill",
      source: "lima",
      "source-layer": "water",
      paint: { "fill-color": "#a8dadc" },
    },
    {
      id: "waterway",
      type: "line",
      source: "lima",
      "source-layer": "waterway",
      paint: { "line-color": "#74c0fc", "line-width": 1.5 },
    },

    // Roads
    {
      id: "roads",
      type: "line",
      source: "lima",
      "source-layer": "transportation",
      paint: {
        "line-color": "#9aa0a6",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.2, 10, 0.8, 14, 2.2],
      },
    },

    // Boundaries (subtle)
    {
      id: "boundary",
      type: "line",
      source: "lima",
      "source-layer": "boundary",
      paint: { "line-color": "#c0c0c0", "line-width": 0.6 },
    },
  ],
};
