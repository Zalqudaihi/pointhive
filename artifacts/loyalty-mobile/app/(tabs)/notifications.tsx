import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { NotificationItem } from "@/components/NotificationItem";
import { useColors } from "@/hooks/useColors";
import {
  getListNotificationsQueryKey,
  useListNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const list = useListNotifications({ query: { staleTime: 15_000 } });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const data = list.data ?? [];
  const unreadCount = useMemo(() => data.filter((n) => !n.read).length, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await list.refetch();
    setRefreshing(false);
  };

  const handleItemPress = (id: number, read: boolean) => {
    if (read) return;
    markRead.mutate(
      { id },
      {
        onSettled: () => {
          qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        },
      },
    );
  };

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    markAll.mutate(undefined, {
      onSettled: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Notifications
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={handleMarkAll}
            disabled={markAll.isPending}
            style={({ pressed }) => [
              styles.markAll,
              {
                backgroundColor: colors.secondary,
                borderRadius: 999,
                opacity: pressed || markAll.isPending ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: colors.secondaryForeground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Mark all read
            </Text>
          </Pressable>
        ) : null}
      </View>

      {list.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon="bell"
            title="Inbox zero"
            body="When something happens, you'll see it here."
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
            gap: 10,
          }}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleItemPress(item.id, item.read)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
