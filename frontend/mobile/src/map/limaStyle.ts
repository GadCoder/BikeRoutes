export const LIMA_STYLE: any = {
  version: 8,
  name: "BikeRoutes Lima (mobile)",
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    lima: {
      type: "vector",
      tiles: ["https://tiles-bikeroutes.gadcoder.com/data/lima/{z}/{x}/{y}.pbf"],
      minzoom: 0,
      maxzoom: 15,
    },
  },
  layers: [
    // Background — matches web #dbeafe (light blue, visible as ocean/empty area)
    { id: "bg", type: "background", paint: { "background-color": "#dbeafe" } },

    // Landcover — wood, grass, scrub (web parity)
    {
      id: "landcover",
      type: "fill",
      source: "lima",
      "source-layer": "landcover",
      paint: {
        "fill-color": [
          "match",
          ["get", "class"],
          "wood",
          "#bbf7d0",
          "grass",
          "#dcfce7",
          "scrub",
          "#d1fae5",
          "#eef2f7",
        ],
        "fill-opacity": 0.9,
      },
    },

    // Landuse — residential, commercial, etc. (web parity colors)
    {
      id: "landuse",
      type: "fill",
      source: "lima",
      "source-layer": "landuse",
      paint: {
        "fill-color": [
          "match",
          ["get", "class"],
          "residential",
          "#f1f5f9",
          "commercial",
          "#e2e8f0",
          "industrial",
          "#e2e8f0",
          "cemetery",
          "#d1fae5",
          "school",
          "#e0f2fe",
          "hospital",
          "#fee2e2",
          "stadium",
          "#e0e7ff",
          "#f8fafc",
        ],
        "fill-opacity": 0.95,
      },
    },

    // Parks
    {
      id: "park",
      type: "fill",
      source: "lima",
      "source-layer": "park",
      paint: { "fill-color": "#a7f3d0", "fill-opacity": 0.9 },
    },

    // Water
    {
      id: "water",
      type: "fill",
      source: "lima",
      "source-layer": "water",
      paint: { "fill-color": "#93c5fd", "fill-opacity": 0.95 },
    },

    // Waterways
    {
      id: "waterway",
      type: "line",
      source: "lima",
      "source-layer": "waterway",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#60a5fa",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 14, 2.2],
      },
    },

    // Boundaries
    {
      id: "boundary",
      type: "line",
      source: "lima",
      "source-layer": "boundary",
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#94a3b8",
        "line-width": 1,
        "line-dasharray": [2, 2],
        "line-opacity": 0.5,
      },
    },

    // Road casing (subtle shadow behind roads)
    {
      id: "road-casing",
      type: "line",
      source: "lima",
      "source-layer": "transportation",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "rgba(15, 23, 42, 0.25)",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          1.2,
          14,
          7.0,
          16,
          12.0,
        ],
        "line-opacity": [
          "match",
          ["get", "class"],
          ["motorway", "trunk", "primary", "secondary"],
          0.25,
          0.12,
        ],
      },
    },

    // Roads — color-coded by class (web parity)
    {
      id: "roads",
      type: "line",
      source: "lima",
      "source-layer": "transportation",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": [
          "match",
          ["get", "class"],
          "motorway",
          "#f97316",
          "trunk",
          "#fb7185",
          "primary",
          "#fb7185",
          "secondary",
          "#fbbf24",
          "tertiary",
          "#fde68a",
          "minor",
          "#ffffff",
          "service",
          "#ffffff",
          "path",
          "#cbd5e1",
          "track",
          "#cbd5e1",
          "rail",
          "#64748b",
          "#ffffff",
        ],
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          [
            "match",
            ["get", "class"],
            "motorway",
            2.2,
            "trunk",
            2.0,
            "primary",
            1.8,
            "secondary",
            1.4,
            0.8,
          ],
          14,
          [
            "match",
            ["get", "class"],
            "motorway",
            6.0,
            "trunk",
            5.5,
            "primary",
            5.0,
            "secondary",
            4.0,
            2.2,
          ],
          16,
          [
            "match",
            ["get", "class"],
            "motorway",
            10.0,
            "trunk",
            9.0,
            "primary",
            8.0,
            "secondary",
            6.0,
            3.0,
          ],
        ],
        "line-opacity": 0.95,
      },
    },

    // Road labels
    {
      id: "road-labels",
      type: "symbol",
      source: "lima",
      "source-layer": "transportation_name",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-font": ["Noto Sans Regular"],
        "symbol-placement": "line",
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#5f6368",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    },
  ],
};
