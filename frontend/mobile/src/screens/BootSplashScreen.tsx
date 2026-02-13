import { useEffect, useMemo, useRef } from "react";
import { Animated, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { shadows } from "../theme/shadows";
import { tokens } from "../theme/tokens";

export function BootSplashScreen() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 120],
      }),
    [shimmer],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.glow} />

      <View style={styles.center}>
        <View style={styles.routeStroke} />
        <View style={[styles.badge, shadows.card]}>
          <Text style={styles.badgeGlyph}>{"\u{1F6B2}"}</Text>
        </View>

        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkBike}>Bike</Text>
          <Text style={styles.wordmarkRoutes}>Routes</Text>
        </View>
        <Text style={styles.subtitle}>URBAN ROUTE EDITOR</Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.loadingLabel}>INITIALIZING MAPS...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { transform: [{ translateX }] }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  glow: {
    position: "absolute",
    top: -140,
    left: -160,
    width: 420,
    height: 420,
    borderRadius: 420,
    backgroundColor: tokens.palette.lightBlue,
    opacity: 0.22,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: tokens.space.xl,
  },
  routeStroke: {
    position: "absolute",
    width: 280,
    height: 120,
    borderColor: tokens.color.primary,
    borderWidth: 3,
    borderRadius: 120,
    opacity: 0.6,
    transform: [{ rotate: "-10deg" }],
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#ffffff",
    borderColor: "rgba(1, 42, 74, 0.08)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeGlyph: {
    fontSize: 34,
  },
  wordmarkRow: {
    flexDirection: "row",
    marginTop: 18,
    alignItems: "baseline",
  },
  wordmarkBike: {
    fontSize: tokens.font.size.xxl,
    fontWeight: tokens.font.weight.bold,
    color: "#1f2937",
    letterSpacing: tokens.font.letterSpacing.tight,
  },
  wordmarkRoutes: {
    fontSize: tokens.font.size.xxl,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.primary,
    letterSpacing: tokens.font.letterSpacing.tight,
  },
  subtitle: {
    marginTop: 6,
    fontSize: tokens.font.size.xs,
    letterSpacing: tokens.font.letterSpacing.wideCaps,
    color: tokens.palette.yaleBlue,
    opacity: 0.75,
  },
  bottom: {
    paddingHorizontal: tokens.space.xl,
    paddingBottom: 28,
  },
  loadingLabel: {
    fontSize: tokens.font.size.xs,
    letterSpacing: tokens.font.letterSpacing.wideCapsSm,
    color: tokens.palette.yaleBlue,
    opacity: 0.7,
    textAlign: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(169, 214, 229, 0.5)",
    overflow: "hidden",
    marginTop: 10,
  },
  progressBar: {
    width: 120,
    height: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
    opacity: 0.9,
  },
});

