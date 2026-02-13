import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

export function IconButton(props: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  testID?: string;
}) {
  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.btn,
        pressed && !props.disabled && styles.btnPressed,
        props.disabled && styles.btnDisabled,
      ]}
    >
      <View style={styles.inner}>
        {props.icon ? <View>{props.icon}</View> : <Text style={styles.fallback}>{props.label}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 44,
    width: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.hairlineStrong,
  },
  btnPressed: {
    backgroundColor: "rgba(169, 214, 229, 0.16)",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    fontSize: 12,
    color: tokens.color.textSecondary,
    fontWeight: tokens.font.weight.bold,
  },
});

