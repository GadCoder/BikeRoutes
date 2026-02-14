import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { tokens } from "../theme/tokens";

const DRAG_THRESHOLD = 30;

/**
 * Uber-style draggable bottom sheet anchored to the bottom of its parent.
 *
 * - `peekContent` is always visible when collapsed (drag handle + header).
 * - `children` are revealed when expanded.
 * - Swipe up to expand, swipe down to collapse, tap handle to toggle.
 */
export function DraggableSheet(props: {
  /** Total height when collapsed (handle + peek content). */
  peekHeight: number;
  /** Total height when fully expanded. */
  expandedHeight: number;
  /** Bottom offset (e.g. for tab bar below). */
  bottomInset: number;
  /** Content shown in collapsed state (header row). */
  peekContent: ReactNode;
  /** Content shown only when expanded. */
  children: ReactNode;
  /** Controlled expanded state. */
  expanded: boolean;
  /** Called when expand/collapse changes. */
  onToggle: (expanded: boolean) => void;
}) {
  const {
    peekHeight,
    expandedHeight,
    bottomInset,
    expanded,
    onToggle,
  } = props;

  // 0 = collapsed, 1 = expanded
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  // Animate when the controlled `expanded` prop changes
  useEffect(() => {
    Animated.spring(anim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start();
  }, [expanded, anim]);

  const toggle = useCallback(
    (next: boolean) => {
      onToggle(next);
    },
    [onToggle],
  );

  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -DRAG_THRESHOLD) {
          toggle(true);
        } else if (g.dy > DRAG_THRESHOLD) {
          toggle(false);
        }
      },
    }),
  ).current;

  const sheetHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [peekHeight, expandedHeight],
    extrapolate: "clamp",
  });

  const contentOpacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          height: sheetHeight,
          bottom: bottomInset,
        },
      ]}
    >
      {/* Drag handle + peek content */}
      <View {...panResponder.panHandlers}>
        <Pressable
          onPress={() => toggle(!expandedRef.current)}
          style={styles.handleArea}
        >
          <View style={styles.handle} />
        </Pressable>
        {props.peekContent}
      </View>

      {/* Expandable content — fades in/out */}
      <Animated.View
        style={[styles.expandedContent, { opacity: contentOpacity }]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        {props.children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    overflow: "hidden",
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(169, 214, 229, 0.65)",
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: tokens.space.lg,
    paddingBottom: tokens.space.md,
  },
});
