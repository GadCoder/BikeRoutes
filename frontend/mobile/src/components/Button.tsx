import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type Variant = "primary" | "secondary" | "ghost";

export function Button(props: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: Variant;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
  testID?: string;
}) {
  const variant = props.variant ?? "primary";

  return (
    <Pressable
      testID={props.testID}
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        pressed && !props.disabled && variant === "primary" && styles.primaryPressed,
        pressed && !props.disabled && variant === "secondary" && styles.secondaryPressed,
        props.disabled && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        {props.leftIcon ? <View style={styles.iconLeft}>{props.leftIcon}</View> : null}
        <Text
          style={[
            styles.label,
            variant === "primary" && styles.primaryLabel,
            variant !== "primary" && styles.secondaryLabel,
          ]}
        >
          {props.label}
        </Text>
        {props.rightIcon ? <View style={styles.iconRight}>{props.rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  label: {
    fontSize: tokens.font.size.md,
    fontWeight: tokens.font.weight.bold,
  },
  primary: {
    backgroundColor: tokens.color.primary,
  },
  primaryPressed: {
    backgroundColor: tokens.color.primaryPressed,
  },
  primaryLabel: {
    color: tokens.color.onPrimary,
  },
  secondary: {
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.hairlineStrong,
  },
  secondaryPressed: {
    backgroundColor: "rgba(169, 214, 229, 0.18)",
  },
  secondaryLabel: {
    color: tokens.palette.yaleBlue3,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.55,
  },
});

