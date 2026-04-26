import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { HexagonIcon } from "@/components/HexagonIcon";
import { useColors } from "@/hooks/useColors";

type Size = "sm" | "md" | "lg";

type Props = {
  points: number;
  size?: Size;
  style?: StyleProp<ViewStyle>;
};

export function PointsBadge({ points, size = "md", style }: Props) {
  const colors = useColors();

  const config = {
    sm: { paddingV: 4, paddingH: 8, fontSize: 12, iconSize: 10, gap: 4 },
    md: { paddingV: 6, paddingH: 12, fontSize: 14, iconSize: 12, gap: 6 },
    lg: { paddingV: 10, paddingH: 16, fontSize: 18, iconSize: 16, gap: 8 },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.primary,
          borderRadius: 999,
          paddingVertical: config.paddingV,
          paddingHorizontal: config.paddingH,
          gap: config.gap,
        },
        style,
      ]}
    >
      <HexagonIcon size={config.iconSize} color={colors.primaryForeground} />
      <Text
        style={{
          color: colors.primaryForeground,
          fontFamily: "Inter_700Bold",
          fontSize: config.fontSize,
        }}
      >
        {points.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
});
