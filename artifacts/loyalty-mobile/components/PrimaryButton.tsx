import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  testID,
}: Props) {
  const colors = useColors();
  const isDisabled = !!loading || !!disabled;

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: {
      bg: colors.primary,
      fg: colors.primaryForeground,
      border: colors.primary,
    },
    secondary: {
      bg: colors.secondary,
      fg: colors.secondaryForeground,
      border: colors.secondary,
    },
    ghost: {
      bg: "transparent",
      fg: colors.foreground,
      border: colors.border,
    },
    destructive: {
      bg: colors.destructive,
      fg: colors.destructiveForeground,
      border: colors.destructive,
    },
  };
  const c = palette[variant];

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderRadius: colors.radius,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          transform: pressed ? [{ scale: 0.98 }] : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
