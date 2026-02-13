import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { GeoJSONLineStringGeometry } from "../../../../shared/src";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { MapCanvas } from "../../components/map/MapCanvas";
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
import {
  formatDistanceKm,
  formatVertices,
  lineStringDistanceMeters,
  lineStringVertexCount,
} from "../../editor/lineStringMetrics";
import { tokens } from "../../theme/tokens";

type Step = 1 | 2 | 3;

function stepTitle(step: Step): string {
  if (step === 1) return "Draw Path";
  if (step === 2) return "Add Markers";
  return "Review";
}

export function EditorScreen(props: { onExit: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [hist, setHist] = useState<HistoryState>(() => historyInit());

  const geometry: GeoJSONLineStringGeometry = hist.present;

  const distanceMeters = useMemo(() => lineStringDistanceMeters(geometry), [geometry]);
  const vertices = geometry.coordinates.length;
  const canUndo = historyCanUndo(hist);
  const canRedo = historyCanRedo(hist);

  const allowMapTaps = step === 1;
  const canProceed = vertices >= 2;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <MapCanvas
          geometry={geometry}
          controlsEnabled={allowMapTaps}
          onPressCoordinate={(pos) => {
            if (!allowMapTaps) return;
            setHist((h) => historyPush(h, appendVertex(h.present, pos)));
          }}
        />

        <View style={styles.topLeft}>
          <IconButton
            label="Back"
            onPress={() => {
              Alert.alert("Exit editor?", "This will sign you out for now.", [
                { text: "Cancel", style: "cancel" },
                { text: "Exit", style: "destructive", onPress: props.onExit },
              ]);
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
            onPress={() => Alert.alert("Not implemented", "Locate/target will be added with MapLibre.")}
            icon={<Text style={styles.iconText}>{"\u25CE"}</Text>}
          />
        </View>

        <View style={styles.sheet}>
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
                onPress={() => setHist((h) => historyPush(h, emptyLineString()))}
                style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>
          </View>

          {step === 1 ? (
            <View style={styles.hintRow}>
              <View style={styles.hintIcon}>
                <Text style={styles.hintIconText}>i</Text>
              </View>
              <Text style={styles.hintText}>Tap map to add points</Text>
            </View>
          ) : (
            <View style={styles.hintRow}>
              <View style={styles.hintIcon}>
                <Text style={styles.hintIconText}>i</Text>
              </View>
              <Text style={styles.hintText}>This step is scaffolded for MVP UI parity.</Text>
            </View>
          )}

          <View style={styles.metricsRow}>
            <MetricCard label="DISTANCE" value={formatDistanceKm(distanceMeters)} />
            <View style={{ width: 12 }} />
            <MetricCard label="VERTICES" value={formatVertices(lineStringVertexCount(geometry))} />
          </View>

          <Button
            label={step === 3 ? "Finish" : "Next"}
            disabled={step === 1 ? !canProceed : false}
            rightIcon={<Text style={styles.nextIcon}>{"\u2192"}</Text>}
            onPress={() => {
              if (step === 1 && !canProceed) return;
              if (step === 3) {
                Alert.alert("Not implemented", "Save flow will be implemented in task 6.2.");
                return;
              }
              setStep((s) => (s === 1 ? 2 : 3));
            }}
            testID="editor_next"
          />
        </View>
      </View>
    </SafeAreaView>
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
  sheet: {
    position: "absolute",
    left: tokens.space.lg,
    right: tokens.space.lg,
    bottom: tokens.space.lg,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.hairline,
    padding: tokens.space.lg,
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
});
