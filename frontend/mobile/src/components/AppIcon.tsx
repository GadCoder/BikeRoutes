import { StyleSheet, Text, View } from "react-native";
import { shadows } from "../theme/shadows";
import { tokens } from "../theme/tokens";

export function AppIcon(props: { size?: number }) {
  const size = props.size ?? 74;
  const radius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.root,
        shadows.float,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <View style={styles.glow} />
      <Text style={styles.glyph}>{"\u{1F6B2}"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(1, 42, 74, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 130,
    backgroundColor: tokens.palette.lightBlue,
    opacity: 0.26,
  },
  glyph: {
    fontSize: 30,
  },
});

