import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { GeoJSONPosition } from "../../../../shared/src";
import { isGeoJSONLineStringGeometry } from "../../../../shared/src";
import { getRoute, type MarkerFeature, type RouteFeature } from "../../api/routes";
import { Button } from "../../components/Button";
import { DraggableSheet } from "../../components/DraggableSheet";
import { IconButton } from "../../components/IconButton";
import { MapCanvas, type MapMarker } from "../../components/map/MapCanvas";
import { lineStringDistanceMeters } from "../../editor/lineStringMetrics";
import { loadRoutesCache, upsertCachedRoute, type CachedRoute } from "../../state/routesCache";
import { tokens } from "../../theme/tokens";
import { formatRelativeTime } from "../../utils/time";

export function RouteDetailsScreen(props: {
  accessToken?: string;
  routeId: string;
  bottomInset: number;
  onBack: () => void;
  onEditRoute: (routeId: string) => void;
}) {
  const [entry, setEntry] = useState<CachedRoute | null>(null);
  const [viewAll, setViewAll] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  async function loadFromCache() {
    const cached = await loadRoutesCache();
    const found = cached.find((r) => r.route.id === props.routeId) ?? null;
    setEntry(found);
  }

  async function refreshFromBackend() {
    try {
      const remote = await getRoute({ accessToken: props.accessToken, routeId: props.routeId });
      const updatedAt = new Date().toISOString();
      await upsertCachedRoute(remote, { updatedAt });
      await loadFromCache();
    } catch {
      // Offline or forbidden: keep cached.
    }
  }

  useEffect(() => {
    void loadFromCache().then(() => refreshFromBackend());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.routeId]);

  const route: RouteFeature | null = entry?.route ?? null;
  const title = route?.properties.title ?? "Route";
  const description = route?.properties.description ?? "No description yet.";

  const markers = (route?.properties.markers ?? []) as MarkerFeature[];
  const markersCount = markers.length;

  const distanceKm = useMemo(() => {
    if (!route) return 0;
    const fromApi = route.properties.distance_km;
    if (typeof fromApi === "number" && Number.isFinite(fromApi)) return fromApi;
    if (isGeoJSONLineStringGeometry(route.geometry)) return lineStringDistanceMeters(route.geometry) / 1000;
    return 0;
  }, [route]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return markers
      .map((m) => {
        const coords = (m.geometry as any)?.coordinates as GeoJSONPosition | undefined;
        if (!coords || coords.length < 2) return null;
        return {
          id: m.id,
          coordinate: coords,
          iconType: String(m.properties.icon_type ?? "default"),
          label: String(m.properties.label ?? ""),
        };
      })
      .filter(Boolean) as MapMarker[];
  }, [markers]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <MapCanvas
          geometry={
            route && isGeoJSONLineStringGeometry(route.geometry) ? route.geometry : { type: "LineString", coordinates: [] }
          }
          markers={mapMarkers}
          controlsEnabled={false}
        />

        <View style={styles.topLeft}>
          <IconButton label="Back" onPress={props.onBack} icon={<Text style={styles.iconText}>{"\u2039"}</Text>} />
        </View>

        <DraggableSheet
          peekHeight={160}
          expandedHeight={420}
          bottomInset={0}
          expanded={sheetExpanded}
          onToggle={setSheetExpanded}
          peekContent={
            <View style={styles.sheetPeek}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>MVP</Text>
                </View>
              </View>

              <Text style={styles.subTitle}>
                Created by you • {entry ? formatRelativeTime(entry.updatedAt) : "recently"}
              </Text>

              <View style={styles.statsRow}>
                <StatCard label="DISTANCE" value={`${distanceKm.toFixed(1)} km`} />
                <StatCard label="ELEV" value={"—"} />
                <StatCard label="MARKERS" value={`${markersCount}`} />
                <StatCard label="TIME" value={"—"} />
              </View>
            </View>
          }
        >
          <ScrollView contentContainerStyle={{ paddingBottom: tokens.space.lg }} showsVerticalScrollIndicator={false}>
            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Edit Route"
                  onPress={() => props.onEditRoute(props.routeId)}
                  leftIcon={<Text style={styles.actionIcon}>✎</Text>}
                />
              </View>
              <View style={{ width: 10 }} />
              <IconButton
                label="Share (coming soon)"
                disabled
                icon={<Text style={styles.squareIcon}>⤴</Text>}
              />
              <View style={{ width: 10 }} />
              <IconButton
                label="Visibility (coming soon)"
                disabled
                icon={<Text style={styles.squareIcon}>☍</Text>}
              />
            </View>

            <Section title="Description">
              <Text style={styles.bodyText}>{description}</Text>
            </Section>

            <Section
              title="Route Markers"
              right={
                <Pressable accessibilityRole="button" onPress={() => setViewAll(true)}>
                  <Text style={styles.viewAll}>View All</Text>
                </Pressable>
              }
            >
              {markersCount === 0 ? (
                <Text style={styles.bodyTextMuted}>No markers yet.</Text>
              ) : (
                <View style={{ marginTop: 8 }}>
                  {markers.slice(0, 3).map((m, idx) => (
                    <MarkerRow key={m.id} idx={idx + 1} marker={m} />
                  ))}
                </View>
              )}
            </Section>
          </ScrollView>
        </DraggableSheet>

        <Modal animationType="slide" transparent visible={viewAll} onRequestClose={() => setViewAll(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setViewAll(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalTop}>
                <Text style={styles.modalTitle}>Route Markers</Text>
                <IconButton label="Close" onPress={() => setViewAll(false)} icon={<Text style={styles.close}>×</Text>} />
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: tokens.space.xl }}>
                {markersCount === 0 ? (
                  <Text style={styles.bodyTextMuted}>No markers yet.</Text>
                ) : (
                  markers.map((m, idx) => <MarkerRow key={m.id} idx={idx + 1} marker={m} />)
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function StatCard(props: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
    </View>
  );
}

function Section(props: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: tokens.space.lg }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{props.title}</Text>
        {props.right ? <View>{props.right}</View> : null}
      </View>
      <View style={styles.sectionBody}>{props.children}</View>
    </View>
  );
}

function MarkerRow(props: { idx: number; marker: MarkerFeature }) {
  const label = String(props.marker.properties.label ?? `Marker ${props.idx}`);
  const iconType = String(props.marker.properties.icon_type ?? "default").toUpperCase();
  return (
    <View style={styles.markerRow}>
      <View style={styles.markerIdx}>
        <Text style={styles.markerIdxText}>{props.idx}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.markerLabel}>{label}</Text>
        <Text style={styles.markerMeta}>{iconType}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  root: {
    flex: 1,
  },
  topLeft: {
    position: "absolute",
    left: tokens.space.lg,
    top: tokens.space.lg,
  },
  iconText: {
    fontSize: 20,
    color: tokens.color.text,
    fontWeight: tokens.font.weight.bold,
    marginTop: -1,
  },
  sheetPeek: {
    paddingHorizontal: tokens.space.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    fontSize: tokens.font.size.xl,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    backgroundColor: "rgba(169, 214, 229, 0.18)",
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.palette.yaleBlue3,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  subTitle: {
    marginTop: 6,
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: tokens.space.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(169, 214, 229, 0.18)",
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: tokens.space.lg,
  },
  actionIcon: {
    color: tokens.color.onPrimary,
    fontWeight: tokens.font.weight.bold,
  },
  squareIcon: {
    fontSize: 18,
    color: tokens.color.textSecondary,
    fontWeight: tokens.font.weight.bold,
    marginTop: -1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  viewAll: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.primary,
    fontWeight: tokens.font.weight.bold,
  },
  sectionBody: {
    marginTop: 8,
  },
  bodyText: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
    lineHeight: 20,
  },
  bodyTextMuted: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.textMuted,
    lineHeight: 20,
  },
  markerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    borderRadius: tokens.radius.md,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  markerIdx: {
    height: 28,
    width: 28,
    borderRadius: 999,
    backgroundColor: tokens.color.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  markerIdxText: {
    color: tokens.color.onPrimary,
    fontWeight: tokens.font.weight.bold,
  },
  markerLabel: {
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  markerMeta: {
    marginTop: 2,
    fontSize: tokens.font.size.xs,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(1, 42, 74, 0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    padding: tokens.space.lg,
    maxHeight: "75%",
  },
  modalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.space.md,
  },
  modalTitle: {
    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  close: {
    fontSize: 22,
    color: tokens.color.text,
    fontWeight: tokens.font.weight.bold,
    marginTop: -1,
  },
});
