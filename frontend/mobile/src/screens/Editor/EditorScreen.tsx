import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "@bikeroutes/shared";
import { isGeoJSONLineStringGeometry } from "@bikeroutes/shared";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { DraggableSheet } from "../../components/DraggableSheet";
import { createMarker, createRoute, getRoute, updateMarker, updateRoute, type Route } from "../../api/routes";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { TextField } from "../../components/TextField";
import { MapCanvas, type MapMarker } from "../../components/map/MapCanvas";
import {
  appendVertex,
  emptyLineString,
  historyCanRedo,
  historyCanUndo,
  historyInit,
  historyPush,
  historyRedo,
  historyUndo,
  type HistoryState,
} from "../../editor/lineStringHistory";
import { formatDistanceKm, lineStringDistanceMeters } from "../../editor/lineStringMetrics";
import { upsertCachedRoute } from "../../state/routesCache";
import { withAuthRetry } from "../../state/session";
import { tokens } from "../../theme/tokens";

type Step = 1 | 2 | 3;

function stepTitle(step: Step): string {
  if (step === 1) return "Draw Path";
  if (step === 2) return "Add Markers";
  return "Review";
}

type DraftMarker = {
  id: string; // local id
  backendId?: string;
  coordinate: GeoJSONPosition;
  label: string;
  iconType: string;
  description: string;
  orderIndex: number;
};

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function EditorScreen(props: {
  accessToken?: string;
  bottomInset: number;
  routeId?: string | null;
  onExitEditor: () => void;
  onSaved: (routeId: string) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [hist, setHist] = useState<HistoryState>(() => historyInit());
  const [draftMarkers, setDraftMarkers] = useState<DraftMarker[]>([]);

  const [saveVisible, setSaveVisible] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [addMarkerVisible, setAddMarkerVisible] = useState(false);
  const [pendingMarkerCoord, setPendingMarkerCoord] = useState<GeoJSONPosition | null>(null);
  const [markerLabel, setMarkerLabel] = useState("");
  const [markerIcon, setMarkerIcon] = useState<"cafe" | "viewpoint" | "repair" | "water">("cafe");
  const [markerDesc, setMarkerDesc] = useState("");

  const [sheetExpanded, setSheetExpanded] = useState(false);

  const geometry: GeoJSONLineStringGeometry = hist.present;

  const distanceMeters = useMemo(() => lineStringDistanceMeters(geometry), [geometry]);
  const vertices = geometry.coordinates.length;
  const canUndo = historyCanUndo(hist);
  const canRedo = historyCanRedo(hist);

  const allowMapTaps = step === 1 || step === 2;
  const canProceed = vertices >= 2;

  const mapMarkers: MapMarker[] = useMemo(() => {
    return draftMarkers.map((m) => ({ id: m.id, coordinate: m.coordinate, iconType: m.iconType, label: m.label }));
  }, [draftMarkers]);

  useEffect(() => {
    if (!props.routeId) {
      setHist(historyInit());
      setDraftMarkers([]);
      setRouteName("");
      setRouteNotes("");
      setStep(1);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const r = await withAuthRetry((token) =>
          getRoute({ accessToken: token, routeId: props.routeId! }),
        );
        if (!mounted) return;
        if (isGeoJSONLineStringGeometry(r.geometry)) setHist(historyInit(r.geometry));
        setRouteName(String(r.title ?? ""));
        setRouteNotes(String(r.description ?? ""));
        const markers = (r.markers ?? []) as any[];
        setDraftMarkers(
          markers
            .map((mf, idx) => {
              const coord = (mf?.geometry?.coordinates ?? null) as GeoJSONPosition | null;
              if (!coord) return null;
              return {
                id: randomId(),
                backendId: String(mf.id),
                coordinate: coord,
                label: String(mf?.label ?? ""),
                iconType: String(mf?.icon_type ?? "default"),
                description: String(mf?.description ?? ""),
                orderIndex: typeof mf?.order_index === "number" ? mf.order_index : idx,
              } as DraftMarker;
            })
            .filter(Boolean) as DraftMarker[],
        );
        setStep(1);
      } catch {
        // If fetch fails, leave current draft as-is.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [props.routeId, props.accessToken]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <MapCanvas
          geometry={geometry}
          markers={mapMarkers}
          controlsEnabled={allowMapTaps}
          onPressCoordinate={(pos) => {
            if (!allowMapTaps) return;
            if (step === 1) {
              setHist((h) => historyPush(h, appendVertex(h.present, pos)));
              return;
            }
            if (step === 2) {
              setPendingMarkerCoord(pos);
              setMarkerLabel("");
              setMarkerIcon("cafe");
              setMarkerDesc("");
              setAddMarkerVisible(true);
            }
          }}
        />

        <View style={styles.topLeft}>
          <IconButton
            label="Back"
            onPress={() => {
              if (vertices > 0 || draftMarkers.length > 0 || step !== 1) {
                Alert.alert("Exit editor?", "Discard your current draft changes?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Exit", style: "destructive", onPress: props.onExitEditor },
                ]);
                return;
              }
              props.onExitEditor();
            }}
            icon={<Text style={styles.iconText}>{"\u2039"}</Text>}
          />
        </View>

        <View style={styles.topRight}>
          <IconButton
            label="Layers"
            onPress={() => Alert.alert("Not implemented", "Layers/style toggle will be added with MapLibre.")}
            icon={<Text style={styles.iconText}>{"\u2630"}</Text>}
          />
          <View style={{ height: 10 }} />
          <IconButton
            label="Locate"
            onPress={() => Alert.alert("Locate", "Coming back next build.") }
            icon={<Text style={styles.iconText}>{"\u25CE"}</Text>}
          />
        </View>

        <DraggableSheet
          peekHeight={110}
          expandedHeight={280}
          bottomInset={0}
          expanded={sheetExpanded}
          onToggle={setSheetExpanded}
          peekContent={
            <View style={styles.sheetPeek}>
              <View style={styles.sheetTopRow}>
                <View style={styles.sheetLeft}>
                  <IconButton
                    label="Undo"
                    disabled={!canUndo}
                    onPress={() => setHist((h) => historyUndo(h))}
                    icon={<Text style={styles.iconTextSmall}>{"\u21B6"}</Text>}
                  />
                  <View style={{ width: 10 }} />
                  <IconButton
                    label="Redo"
                    disabled={!canRedo}
                    onPress={() => setHist((h) => historyRedo(h))}
                    icon={<Text style={styles.iconTextSmall}>{"\u21B7"}</Text>}
                  />
                </View>

                <View style={styles.sheetCenter}>
                  <Text style={styles.sheetTitle}>{stepTitle(step)}</Text>
                  <Text style={styles.sheetStep}>Step {step} of 3</Text>
                </View>

                <View style={styles.sheetRight}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setHist((h) => historyPush(h, emptyLineString()));
                      setDraftMarkers([]);
                    }}
                    style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                </View>
              </View>

              {step === 1 ? (
                <HintRow text="Tap map to add points" />
              ) : step === 2 ? (
                <HintRow text="Tap map to add markers" />
              ) : (
                <HintRow text="Review and save your route." />
              )}
            </View>
          }
        >
          <View style={styles.metricsRow}>
            <MetricCard label="DISTANCE" value={formatDistanceKm(distanceMeters)} />
            <View style={{ width: 12 }} />
            {step === 1 ? (
              <MetricCard label="VERTICES" value={`${vertices} pts`} />
            ) : (
              <MetricCard label="MARKERS" value={`${draftMarkers.length} placed`} />
            )}
          </View>

          <Button
            label={step === 3 ? "Finish" : "Next"}
            disabled={step === 1 ? !canProceed : false}
            rightIcon={<Text style={styles.nextIcon}>{"\u2192"}</Text>}
            onPress={() => {
              if (step === 1 && !canProceed) return;
              if (step === 3) {
                setSaveVisible(true);
                return;
              }
              setStep((s) => (s === 1 ? 2 : 3));
            }}
            testID="editor_next"
          />
        </DraggableSheet>

        <Modal animationType="slide" transparent visible={saveVisible} onRequestClose={() => setSaveVisible(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => (saving ? null : setSaveVisible(false))} />
            <View style={styles.modalSheet}>
              <View style={styles.modalTop}>
                <Text style={styles.modalTitle}>Save Your Route</Text>
                <IconButton
                  label="Close"
                  disabled={saving}
                  onPress={() => setSaveVisible(false)}
                  icon={<Text style={styles.close}>×</Text>}
                />
              </View>

              <TextField
                label="Route Name"
                value={routeName}
                onChangeText={setRouteName}
                placeholder="e.g. Sunday Loop"
                autoCapitalize="words"
              />
              <TextField
                label="Notes (Optional)"
                value={routeNotes}
                onChangeText={setRouteNotes}
                placeholder="Add notes..."
                multiline
                numberOfLines={4}
                autoCapitalize="sentences"
              />

              <View style={styles.summaryRow}>
                <SummaryCard label="DISTANCE" value={formatDistanceKm(distanceMeters)} />
                <View style={{ width: 12 }} />
                <SummaryCard label="MARKERS" value={`${draftMarkers.length} placed`} />
              </View>

              <Button
                label={saving ? "Saving..." : "Save to My Routes"}
                disabled={saving || routeName.trim().length === 0 || vertices < 2}
                leftIcon={<Text style={styles.check}>✓</Text>}
                onPress={async () => {
                  const title = routeName.trim();
                  if (!title) return;
                  setSaving(true);
                  try {
                    const saved = await withAuthRetry((token) =>
                      saveRouteToBackend({
                        accessToken: token,
                        routeId: props.routeId ?? null,
                        title,
                        description: routeNotes.trim() || undefined,
                        geometry,
                        markers: draftMarkers,
                      }),
                    );
                    await upsertCachedRoute(saved);
                    setSaveVisible(false);
                    props.onSaved(saved.id);
                  } catch (e) {
                    Alert.alert("Save failed", "Could not save to the backend. Check your session and API URL.");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent
          visible={addMarkerVisible}
          onRequestClose={() => setAddMarkerVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setAddMarkerVisible(false)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalTop}>
                <View>
                  <Text style={styles.modalTitle}>Add Marker</Text>
                  <Text style={styles.modalSubtitle}>Specify details for this location</Text>
                </View>
                <IconButton label="Close" onPress={() => setAddMarkerVisible(false)} icon={<Text style={styles.close}>×</Text>} />
              </View>

              <TextField
                label="MARKER LABEL"
                value={markerLabel}
                onChangeText={setMarkerLabel}
                placeholder="e.g. Sunny Rest Stop"
                autoCapitalize="words"
              />

              <View style={styles.iconRow}>
                <Text style={styles.iconRowTitle}>SELECT ICON</Text>
                <View style={{ height: 10 }} />
                <View style={styles.iconChoices}>
                  <IconChoice label="CAFE" selected={markerIcon === "cafe"} onPress={() => setMarkerIcon("cafe")} />
                  <IconChoice
                    label="VIEWPOINT"
                    selected={markerIcon === "viewpoint"}
                    onPress={() => setMarkerIcon("viewpoint")}
                  />
                  <IconChoice label="REPAIR" selected={markerIcon === "repair"} onPress={() => setMarkerIcon("repair")} />
                  <IconChoice label="WATER" selected={markerIcon === "water"} onPress={() => setMarkerIcon("water")} />
                </View>
              </View>

              <TextField
                label="DESCRIPTION (OPTIONAL)"
                value={markerDesc}
                onChangeText={setMarkerDesc}
                placeholder="Add notes..."
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />

              <Button
                label="Add Marker"
                disabled={markerLabel.trim().length === 0 || !pendingMarkerCoord}
                onPress={() => {
                  const coord = pendingMarkerCoord;
                  if (!coord) return;
                  const next: DraftMarker = {
                    id: randomId(),
                    coordinate: coord,
                    label: markerLabel.trim(),
                    iconType: markerIcon,
                    description: markerDesc.trim(),
                    orderIndex: draftMarkers.length,
                  };
                  setDraftMarkers((m) => [...m, next]);
                  setAddMarkerVisible(false);
                }}
              />
              <Pressable accessibilityRole="button" onPress={() => setAddMarkerVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function HintRow(props: { text: string }) {
  return (
    <View style={styles.hintRow}>
      <View style={styles.hintIcon}>
        <Text style={styles.hintIconText}>i</Text>
      </View>
      <Text style={styles.hintText}>{props.text}</Text>
    </View>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

function SummaryCard(props: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

function IconChoice(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.iconChoice,
        props.selected && styles.iconChoiceSelected,
        pressed && !props.selected && styles.iconChoicePressed,
      ]}
    >
      <Text style={[styles.iconChoiceGlyph, props.selected && styles.iconChoiceGlyphSelected]}>{props.label.slice(0, 1)}</Text>
      <Text style={[styles.iconChoiceLabel, props.selected && styles.iconChoiceLabelSelected]}>{props.label}</Text>
    </Pressable>
  );
}

async function saveRouteToBackend(args: {
  accessToken?: string;
  routeId: string | null;
  title: string;
  description?: string;
  geometry: GeoJSONLineStringGeometry;
  markers: DraftMarker[];
}): Promise<Route> {
  if (!args.accessToken) throw new Error("No access token");

  const route =
    args.routeId == null
      ? await createRoute({
          accessToken: args.accessToken,
          title: args.title,
          description: args.description,
          geometry: args.geometry,
        })
      : await updateRoute({
          accessToken: args.accessToken,
          routeId: args.routeId,
          title: args.title,
          description: args.description,
          geometry: args.geometry,
        });

  for (const m of args.markers) {
    const geom = { type: "Point", coordinates: m.coordinate } as const;
    if (m.backendId) {
      await updateMarker({
        accessToken: args.accessToken,
        routeId: route.id,
        markerId: m.backendId,
        geometry: geom,
        label: m.label,
        description: m.description || undefined,
        iconType: m.iconType,
        orderIndex: m.orderIndex,
      });
    } else {
      const created = await createMarker({
        accessToken: args.accessToken,
        routeId: route.id,
        geometry: geom,
        label: m.label,
        description: m.description || undefined,
        iconType: m.iconType,
        orderIndex: m.orderIndex,
      });
      m.backendId = created.id;
    }
  }

  return await getRoute({ accessToken: args.accessToken, routeId: route.id });
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
  iconTextSmall: {
    fontSize: 18,
    color: tokens.color.text,
    fontWeight: tokens.font.weight.bold,
  },
  sheetPeek: {
    paddingHorizontal: tokens.space.lg,
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sheetLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sheetCenter: {
    flex: 1,
    alignItems: "center",
  },
  sheetRight: {
    alignItems: "flex-end",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  sheetStep: {
    marginTop: 2,
    fontSize: 12,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
  },
  clearBtnPressed: {
    backgroundColor: "rgba(169, 214, 229, 0.18)",
  },
  clearText: {
    fontSize: 12,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.primary,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  hintRow: {
    marginTop: tokens.space.md,
    flexDirection: "row",
    alignItems: "center",
  },
  hintIcon: {
    height: 22,
    width: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.color.hairlineStrong,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  hintIconText: {
    fontSize: 12,
    color: tokens.color.textSecondary,
    fontWeight: tokens.font.weight.bold,
  },
  hintText: {
    fontSize: 13,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.medium,
  },
  metricsRow: {
    marginTop: tokens.space.md,
    flexDirection: "row",
    marginBottom: tokens.space.lg,
  },
  metricCard: {
    flex: 1,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    backgroundColor: "rgba(169, 214, 229, 0.12)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontSize: 11,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 18,
    color: tokens.color.text,
    fontWeight: tokens.font.weight.bold,
  },
  nextIcon: {
    color: tokens.color.onPrimary,
    fontSize: 18,
    fontWeight: tokens.font.weight.bold,
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
    maxHeight: "85%",
  },
  modalTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: tokens.space.sm,
  },
  modalTitle: {
    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
  },
  close: {
    fontSize: 22,
    color: tokens.color.text,
    fontWeight: tokens.font.weight.bold,
    marginTop: -1,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(169, 214, 229, 0.12)",
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  check: {
    color: tokens.color.onPrimary,
    fontWeight: tokens.font.weight.bold,
  },
  iconRow: {
    marginTop: tokens.space.md,
  },
  iconRowTitle: {
    fontSize: 12,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.bold,
    textTransform: "uppercase",
  },
  iconChoices: {
    flexDirection: "row",
  },
  iconChoice: {
    flex: 1,
    marginRight: 10,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  iconChoicePressed: {
    backgroundColor: "rgba(169, 214, 229, 0.16)",
  },
  iconChoiceSelected: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  iconChoiceGlyph: {
    fontSize: 16,
    color: tokens.palette.yaleBlue3,
    fontWeight: tokens.font.weight.bold,
  },
  iconChoiceGlyphSelected: {
    color: tokens.color.onPrimary,
  },
  iconChoiceLabel: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: tokens.palette.yaleBlue3,
    fontWeight: tokens.font.weight.bold,
  },
  iconChoiceLabelSelected: {
    color: tokens.color.onPrimary,
  },
  cancelBtn: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.primary,
    fontWeight: tokens.font.weight.bold,
  },
});
