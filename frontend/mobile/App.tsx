import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PALETTE = {
  deepSpaceBlue: "#012a4a",
  yaleBlue: "#013a63",
  cerulean: "#2c7da0",
  lightBlue: "#a9d6e5",
};

function BootSplash() {
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
    <SafeAreaView style={styles.splashRoot}>
      <View style={styles.glow} />

      <View style={styles.center}>
        <View style={styles.routeStroke} />
        <View style={styles.badge}>
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
          <Animated.View
            style={[
              styles.progressBar,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (booting) return <BootSplash />;

  return (
    <SafeAreaView style={styles.appRoot}>
      <Text style={styles.appTitle}>BikeRoutes</Text>
      <Text style={styles.appBody}>Mobile shell (Expo + React Native + TS).</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: "white",
    padding: 24,
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: PALETTE.deepSpaceBlue,
    textAlign: "center",
  },
  appBody: {
    marginTop: 8,
    fontSize: 14,
    color: PALETTE.yaleBlue,
    opacity: 0.8,
    textAlign: "center",
  },
  splashRoot: {
    flex: 1,
    backgroundColor: "white",
  },
  glow: {
    position: "absolute",
    top: -140,
    left: -160,
    width: 420,
    height: 420,
    borderRadius: 420,
    backgroundColor: PALETTE.lightBlue,
    opacity: 0.22,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  routeStroke: {
    position: "absolute",
    width: 280,
    height: 120,
    borderColor: PALETTE.cerulean,
    borderWidth: 3,
    borderRadius: 120,
    opacity: 0.6,
    transform: [{ rotate: "-10deg" }],
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "white",
    borderColor: "rgba(1, 42, 74, 0.08)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
    fontSize: 34,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  wordmarkRoutes: {
    fontSize: 34,
    fontWeight: "700",
    color: PALETTE.cerulean,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    letterSpacing: 2.2,
    color: PALETTE.yaleBlue,
    opacity: 0.75,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  loadingLabel: {
    fontSize: 12,
    letterSpacing: 2.0,
    color: PALETTE.yaleBlue,
    opacity: 0.7,
    textAlign: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(169, 214, 229, 0.5)",
    overflow: "hidden",
    marginTop: 10,
  },
  progressBar: {
    width: 120,
    height: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.cerulean,
    opacity: 0.9,
  },
});

