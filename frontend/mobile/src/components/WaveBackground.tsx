import { StyleSheet, View } from "react-native";
import { tokens } from "../theme/tokens";

export function WaveBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.glow} />
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={[
            styles.wave,
            {
              top: 90 + i * 42,
              left: -120 + (i % 2) * 34,
              opacity: 0.08 - i * 0.006,
              transform: [{ rotate: i % 2 ? "-7deg" : "6deg" }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: -160,
    left: -160,
    width: 420,
    height: 420,
    borderRadius: 420,
    backgroundColor: tokens.palette.lightBlue,
    opacity: 0.18,
  },
  wave: {
    position: "absolute",
    width: 520,
    height: 120,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: tokens.palette.cerulean,
  },
});

