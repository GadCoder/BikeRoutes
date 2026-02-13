import { palette } from "./palette";

export const tokens = {
  palette,

  color: {
    bg: "#ffffff",
    surface: "#ffffff",
    text: palette.deepSpaceBlue,
    textSecondary: "rgba(1, 42, 74, 0.78)",
    textMuted: "rgba(1, 58, 99, 0.62)",
    hairline: "rgba(169, 214, 229, 0.55)",
    hairlineStrong: "rgba(169, 214, 229, 0.85)",
    primary: palette.cerulean,
    primaryPressed: palette.richCerulean,
    onPrimary: "#ffffff",
    shadow: "#000000",
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    pill: 999,
  },

  space: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },

  font: {
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 28,
      xxl: 34,
    },
    weight: {
      regular: "400" as const,
      medium: "600" as const,
      bold: "700" as const,
    },
    letterSpacing: {
      tight: -0.5,
      wideCaps: 2.2,
      wideCapsSm: 2.0,
    },
  },
} as const;

