import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { avatarForUserId } from "@/constants/demoUsers";
import { useColors } from "@/hooks/useColors";

type Props = {
  userId?: number | null;
  name?: string | null;
  size?: number;
};

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Avatar({ userId, name, size = 40 }: Props) {
  const colors = useColors();
  const source = avatarForUserId(userId ?? null);

  if (source) {
    return (
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.secondary,
        },
      ]}
    >
      <Text
        style={{
          color: colors.secondaryForeground,
          fontSize: Math.max(12, size * 0.4),
          fontFamily: "Inter_700Bold",
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
