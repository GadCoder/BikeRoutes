import { StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

export function DividerLabel(props: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rule} />
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: tokens.space.lg,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.color.hairline,
  },
  label: {
    marginHorizontal: 12,
    fontSize: tokens.font.size.xs,
    letterSpacing: 1.6,
    color: tokens.color.textMuted,
    fontWeight: tokens.font.weight.medium,
  },
});

