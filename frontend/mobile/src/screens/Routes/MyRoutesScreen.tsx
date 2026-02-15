import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { deleteRoute, listRoutes, type Route } from "../../api/routes";
import { DraggableSheet } from "../../components/DraggableSheet";
import { IconButton } from "../../components/IconButton";
import { MapCanvas } from "../../components/map/MapCanvas";
import { tokens } from "../../theme/tokens";
import { formatRelativeTime } from "../../utils/time";
import { loadRoutesCache, removeCachedRoute, saveRoutesCache, type CachedRoute } from "../../state/routesCache";
import { withAuthRetry } from "../../state/session";
import { isGeoJSONLineStringGeometry } from "@bikeroutes/shared";
import { lineStringDistanceMeters } from "../../editor/lineStringMetrics";

export function MyRoutesScreen(props: {
  accessToken?: string;
  bottomInset: number;
  isActive: boolean;
  onCreate: () => void;
  onOpenRoute: (routeId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<CachedRoute[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  async function loadFromCache(): Promise<CachedRoute[]> {
    const cached = await loadRoutesCache();
    setRoutes(sortCached(cached));
    return cached;
  }

  async function refreshFromBackend(base?: CachedRoute[]) {
    try {
      setLoading(true);
      const remote = await withAuthRetry((token) =>
        listRoutes({ accessToken: token }),
      );
      const merged = mergeRemoteIntoCache(remote, base ?? routes);
      setRoutes(sortCached(merged));
      await saveRoutesCache(merged);
    } catch {
      // Offline or server down: keep cached routes.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load.
    void loadFromCache().then((cached) => refreshFromBackend(cached));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!props.isActive) return;
    void loadFromCache().then((cached) => refreshFromBackend(cached));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isActive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) => (r.route.title ?? "").toLowerCase().includes(q));
  }, [routes, query]);

  const empty = filtered.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {empty ? <MapCanvas geometry={{ type: "LineString", coordinates: [] }} controlsEnabled={false} /> : null}

        {empty ? (
          <View style={styles.topRight}>
            <IconButton
              label="Layers"
              onPress={() => Alert.alert("Not implemented", "Layers/style toggle will be added with MapLibre.")}
              icon={<Text style={styles.iconText}>{"\u2630"}</Text>}
            />
            <View style={{ height: 10 }} />
            <IconButton
              label="Locate"
              onPress={() => Alert.alert("Not implemented", "Locate/target will be added with MapLibre.")}
              icon={<Text style={styles.iconText}>{"\u25CE"}</Text>}
            />
          </View>
        ) : null}

        <DraggableSheet
          peekHeight={130}
          expandedHeight={empty ? 340 : 420}
          bottomInset={0}
          expanded={sheetExpanded}
          onToggle={setSheetExpanded}
          peekContent={
            <View style={styles.sheetPeek}>
              <View style={styles.topBar}>
                <Text style={styles.title}>My Routes</Text>
                <IconButton
                  label="Create route"
                  onPress={props.onCreate}
                  icon={<Text style={styles.plus}>+</Text>}
                  testID="routes_create"
                />
              </View>

              <View style={styles.searchWrap}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search routes..."
                  placeholderTextColor={"rgba(1, 58, 99, 0.45)"}
                  style={styles.search}
                  returnKeyType="search"
                  onSubmitEditing={() => refreshFromBackend()}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => refreshFromBackend()}
                  style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
                >
                  <Text style={styles.refreshText}>{loading ? "..." : "Refresh"}</Text>
                </Pressable>
              </View>
            </View>
          }
        >
          {empty ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>⟲</Text>
              </View>
              <Text style={styles.emptyTitle}>No routes yet</Text>
              <Text style={styles.emptySub}>Start drawing your first route and save it for later.</Text>
              <View style={{ height: tokens.space.lg }} />
              <Pressable
                accessibilityRole="button"
                onPress={props.onCreate}
                style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
              >
                <Text style={styles.emptyCtaText}>Start Drawing</Text>
                <Text style={styles.emptyCtaArrow}>→</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {filtered.map((r) => (
                <RouteCard
                  key={r.route.id}
                  entry={r}
                  onPress={() => props.onOpenRoute(r.route.id)}
                  onDelete={() => {
                    const title = r.route.title ?? "Untitled route";
                    Alert.alert("Delete route?", `Delete "${title}" from My Routes?`, [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await withAuthRetry((token) =>
                              deleteRoute({ accessToken: token, routeId: r.route.id }),
                            );
                          } catch {
                            // If backend delete fails, still remove local copy (MVP cache-first).
                          }
                          await removeCachedRoute(r.route.id);
                          await loadFromCache();
                        },
                      },
                    ]);
                  }}
                />
              ))}
            </ScrollView>
          )}
        </DraggableSheet>
      </View>
    </SafeAreaView>
  );
}

function RouteCard(props: { entry: CachedRoute; onPress: () => void; onDelete: () => void }) {
  const title = props.entry.route.title ?? "Untitled route";
  const markersCount = props.entry.route.markers?.length ?? 0;

  const distanceKm = useMemo(() => {
    const fromApi = props.entry.route.distance_km;
    if (typeof fromApi === "number" && Number.isFinite(fromApi)) return fromApi;
    if (isGeoJSONLineStringGeometry(props.entry.route.geometry)) {
      return lineStringDistanceMeters(props.entry.route.geometry) / 1000;
    }
    return 0;
  }, [props.entry.route.geometry, props.entry.route.distance_km]);

  const rel = formatRelativeTime(props.entry.route.updated_at || props.entry.cachedAt);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <MetaChip icon="↦" label={`${distanceKm.toFixed(1)} km`} />
            <MetaChip icon="◎" label={`${markersCount} markers`} />
            <MetaChip icon="◷" label={rel} />
          </View>
        </View>

        <IconButton
          label="Delete route"
          onPress={props.onDelete}
          icon={<Text style={styles.trash}>⌫</Text>}
          testID={`route_delete_${props.entry.route.id}`}
        />
      </View>

      <View style={styles.thumb}>
        <View style={styles.thumbInner}>
          <Text style={styles.thumbText}>THUMBNAIL</Text>
        </View>
      </View>
    </Pressable>
  );
}

function MetaChip(props: { icon: string; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaIcon}>{props.icon}</Text>
      <Text style={styles.metaText}>{props.label}</Text>
    </View>
  );
}

function sortCached(routes: CachedRoute[]): CachedRoute[] {
  const key = (r: CachedRoute) => r.route.updated_at || r.cachedAt;
  return routes.slice().sort((a, b) => key(b).localeCompare(key(a)));
}

function mergeRemoteIntoCache(remote: Route[], existing: CachedRoute[]): CachedRoute[] {
  const now = new Date().toISOString();
  const byId = new Map(existing.map((r) => [r.route.id, r] as const));
  for (const r of remote) {
    const prev = byId.get(r.id);
    byId.set(r.id, { route: r, cachedAt: prev?.cachedAt ?? now });
  }
  return [...byId.values()];
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  root: {
    flex: 1,
  },
  topRight: {
    position: "absolute",
    right: tokens.space.lg,
    top: tokens.space.lg,
    alignItems: "center",
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: tokens.font.size.xl,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
    letterSpacing: tokens.font.letterSpacing.tight,
  },
  plus: {
    fontSize: 22,
    color: tokens.color.text,
    fontWeight: tokens.font.weight.bold,
    marginTop: -1,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: tokens.space.md,
  },
  search: {
    flex: 1,
    height: 46,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    fontSize: tokens.font.size.md,
    color: tokens.color.text,
  },
  refreshBtn: {
    marginLeft: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.color.hairlineStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.surface,
  },
  refreshBtnPressed: {
    backgroundColor: "rgba(169, 214, 229, 0.18)",
  },
  refreshText: {
    fontSize: 12,
    fontWeight: tokens.font.weight.bold,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    textTransform: "uppercase",
    color: tokens.palette.yaleBlue3,
  },
  list: {
    paddingTop: tokens.space.lg,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    padding: tokens.space.lg,
    marginBottom: tokens.space.md,
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.98,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(169, 214, 229, 0.18)",
    marginRight: 8,
    marginBottom: 8,
  },
  metaIcon: {
    marginRight: 6,
    fontSize: 12,
    color: tokens.palette.yaleBlue3,
    fontWeight: tokens.font.weight.bold,
  },
  metaText: {
    fontSize: 12,
    color: tokens.palette.yaleBlue3,
    fontWeight: tokens.font.weight.bold,
  },
  trash: {
    fontSize: 18,
    color: tokens.color.textSecondary,
    fontWeight: tokens.font.weight.bold,
  },
  thumb: {
    marginTop: tokens.space.md,
    height: 110,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    overflow: "hidden",
    backgroundColor: "#f7fbfd",
  },
  thumbInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: {
    fontSize: 12,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.xl,
  },
  emptyIcon: {
    height: 80,
    width: 80,
    borderRadius: 999,
    backgroundColor: "rgba(169, 214, 229, 0.22)",
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  emptyIconText: {
    fontSize: 28,
    color: tokens.color.primary,
    fontWeight: tokens.font.weight.bold,
  },
  emptyTitle: {
    marginTop: tokens.space.lg,
    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  emptySub: {
    marginTop: 8,
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCta: {
    height: 52,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.primary,
    width: "100%",
  },
  emptyCtaPressed: {
    backgroundColor: tokens.color.primaryPressed,
  },
  emptyCtaText: {
    color: tokens.color.onPrimary,
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
  },
  emptyCtaArrow: {
    marginLeft: 10,
    color: tokens.color.onPrimary,
    fontSize: 16,
    fontWeight: tokens.font.weight.bold,
  },
});
