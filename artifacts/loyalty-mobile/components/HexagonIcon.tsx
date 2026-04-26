import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

type Props = {
  size?: number;
  color: string;
  filled?: boolean;
};

/**
 * PointHive's brand hexagon. Uses MaterialCommunityIcons because
 * FontAwesome6 Free does not include a plain `hexagon` glyph.
 */
export function HexagonIcon({ size = 16, color, filled = true }: Props) {
  return (
    <MaterialCommunityIcons
      name={filled ? "hexagon" : "hexagon-outline"}
      size={size}
      color={color}
    />
  );
}
