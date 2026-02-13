import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "../../../../shared/src";
import { tokens } from "../../theme/tokens";

type Size = { w: number; h: number };

type BBox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

const DEFAULT_BBOX_SF: BBox = {
  minLon: -122.52,
  minLat: 37.70,
  maxLon: -122.35,
  maxLat: 37.82,
};

function projectToScreen(pos: GeoJSONPosition, size: Size, bbox: BBox): { x: number; y: number } {
  const [lon, lat] = pos;
  const x = ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * size.w;
  const y = ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) * size.h;
  return { x, y };
}

function unprojectFromScreen(x: number, y: number, size: Size, bbox: BBox): GeoJSONPosition {
  const lon = bbox.minLon + (x / size.w) * (bbox.maxLon - bbox.minLon);
  const lat = bbox.maxLat - (y / size.h) * (bbox.maxLat - bbox.minLat);
  return [lon, lat];
}

export function StubMap(props: {
  geometry: GeoJSONLineStringGeometry;
  onPressCoordinate?: (pos: GeoJSONPosition) => void;
  controlsEnabled?: boolean;
}) {
  const [size, setSize] = useState<Size>({ w: 1, h: 1 });
  const bbox = DEFAULT_BBOX_SF;

  const pts = useMemo(() => {
    return props.geometry.coordinates.map((c) => projectToScreen(c, size, bbox));
  }, [props.geometry.coordinates, size.w, size.h, bbox.minLon, bbox.maxLon, bbox.minLat, bbox.maxLat]);

  const segments = useMemo(() => {
    const out: Array<{
      left: number;
      top: number;
      width: number;
      angleDeg: number;
    }> = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const width = Math.sqrt(dx * dx + dy * dy);
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      out.push({ left: a.x, top: a.y, width, angleDeg });
    }
    return out;
  }, [pts]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.max(1, width), h: Math.max(1, height) });
  }

  return (
    <View
      style={styles.root}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onResponderRelease={(e) => {
        if (!props.controlsEnabled) return;
        const { locationX, locationY } = e.nativeEvent;
        props.onPressCoordinate?.(unprojectFromScreen(locationX, locationY, size, bbox));
      }}
    >
      <View style={styles.grid} pointerEvents="none" />
      <Text style={styles.watermark} pointerEvents="none">
        MAP (STUB)
      </Text>

      <View style={styles.drawLayer} pointerEvents="none">
        {segments.map((s, idx) => (
          <View
            key={`${idx}-${Math.round(s.left)}-${Math.round(s.top)}-${Math.round(s.width)}`}
            style={[
              styles.segment,
              {
                left: s.left,
                top: s.top,
                width: s.width,
                transform: [{ translateY: -2 }, { rotate: `${s.angleDeg}deg` }],
              },
            ]}
          />
        ))}

        {pts.map((p, idx) => (
          <View
            key={`${idx}-${Math.round(p.x)}-${Math.round(p.y)}`}
            style={[styles.vertexOuter, { left: p.x - 7, top: p.y - 7 }]}
          >
            <View style={styles.vertexInner} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f7fbfd",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
    backgroundColor: "transparent",
    borderColor: "rgba(169, 214, 229, 0.28)",
    borderWidth: 1,
  },
  watermark: {
    position: "absolute",
    top: tokens.space.xl,
    alignSelf: "center",
    fontSize: 12,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
  },
  drawLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  segment: {
    position: "absolute",
    height: 4,
    backgroundColor: tokens.color.primary,
    borderRadius: 999,
  },
  vertexOuter: {
    position: "absolute",
    height: 14,
    width: 14,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: tokens.color.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  vertexInner: {
    height: 4,
    width: 4,
    borderRadius: 999,
    backgroundColor: tokens.color.primary,
  },
});
