import type { ViewStyle } from "react-native";
import { tokens } from "./tokens";

export const shadows = {
  card: {
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  } satisfies ViewStyle,
  float: {
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  } satisfies ViewStyle,
} as const;

