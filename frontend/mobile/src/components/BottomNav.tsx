import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

export type BottomTab = "routes" | "editor" | "profile";

export const BOTTOM_NAV_HEIGHT = 76;

export function BottomNav(props: { active: BottomTab; onSelect: (t: BottomTab) => void }) {
  return (
    <View style={styles.root}>
      <Tab
        label="My Routes"
        icon="≋"
        active={props.active === "routes"}
        onPress={() => props.onSelect("routes")}
      />
      <Tab
        label="Editor"
        icon="✎"
        active={props.active === "editor"}
        onPress={() => props.onSelect("editor")}
      />
      <Tab
        label="Profile"
        icon="◉"
        active={props.active === "profile"}
        onPress={() => props.onSelect("profile")}
      />
    </View>
  );
}

function Tab(props: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={props.onPress} style={styles.tab}>
      <Text style={[styles.icon, props.active && styles.iconActive]}>{props.icon}</Text>
      <Text style={[styles.label, props.active && styles.labelActive]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    height: BOTTOM_NAV_HEIGHT,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: tokens.color.hairline,
    backgroundColor: tokens.color.surface,
    paddingHorizontal: tokens.space.md,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
    color: tokens.palette.steelBlue,
    marginBottom: 4,
  },
  iconActive: {
    color: tokens.color.primary,
  },
  label: {
    fontSize: tokens.font.size.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: tokens.font.weight.bold,
    color: "rgba(1, 58, 99, 0.56)",
  },
  labelActive: {
    color: tokens.color.primary,
  },
});

