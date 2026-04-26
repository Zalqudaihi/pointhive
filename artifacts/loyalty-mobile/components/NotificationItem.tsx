import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Notification } from "@workspace/api-client-react";

const ICON_BY_TYPE: Record<
  Notification["type"],
  React.ComponentProps<typeof Feather>["name"]
> = {
  purchase: "shopping-bag",
  transfer: "send",
  system: "bell",
  marketplace: "trending-up",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

type Props = {
  notification: Notification;
  onPress?: () => void;
};

export function NotificationItem({ notification, onPress }: Props) {
  const colors = useColors();
  const iconName = ICON_BY_TYPE[notification.type] ?? "bell";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: notification.read ? colors.card : colors.secondary,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: notification.read ? colors.muted : colors.primary,
          },
        ]}
      >
        <Feather
          name={iconName}
          size={16}
          color={
            notification.read ? colors.mutedForeground : colors.primaryForeground
          }
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={{
              flex: 1,
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: colors.foreground,
            }}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read ? (
            <View
              style={[styles.unreadDot, { backgroundColor: colors.primary }]}
            />
          ) : null}
        </View>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            color: colors.mutedForeground,
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 11,
            color: colors.mutedForeground,
            marginTop: 6,
          }}
        >
          {relativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
