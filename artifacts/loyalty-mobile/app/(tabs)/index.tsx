import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { HexagonIcon } from "@/components/HexagonIcon";
import { ProductCard } from "@/components/ProductCard";
import { useColors } from "@/hooks/useColors";
import {
  useGetCurrentUser,
  useGetDashboardActivity,
  useGetDashboardSummary,
  useGetTrendingProducts,
} from "@workspace/api-client-react";

function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Feather>["name"];
  tint: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Feather name={icon} size={14} color={colors.primaryForeground} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.qa,
        {
          backgroundColor: colors.secondary,
          borderRadius: colors.radius,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Feather name={icon} size={20} color={colors.secondaryForeground} />
      <Text
        style={{
          color: colors.secondaryForeground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const ACTIVITY_ICONS: Record<
  "purchase" | "transfer" | "exchange" | "listing",
  React.ComponentProps<typeof Feather>["name"]
> = {
  purchase: "shopping-bag",
  transfer: "send",
  exchange: "repeat",
  listing: "tag",
};

function ActivityRow({
  type,
  title,
  subtitle,
  pointsAmount,
}: {
  type: "purchase" | "transfer" | "exchange" | "listing";
  title: string;
  subtitle: string;
  pointsAmount: number | null;
}) {
  const colors = useColors();
  const highlight = type === "purchase" || type === "transfer";
  return (
    <View style={[styles.activityRow, { borderBottomColor: colors.border }]}>
      <View
        style={[
          styles.activityIcon,
          { backgroundColor: highlight ? colors.secondary : colors.muted },
        ]}
      >
        <Feather
          name={ACTIVITY_ICONS[type] ?? "activity"}
          size={14}
          color={
            highlight ? colors.secondaryForeground : colors.mutedForeground
          }
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            color: colors.foreground,
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            color: colors.mutedForeground,
            fontSize: 12,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {pointsAmount != null ? (
        <View style={styles.activityAmount}>
          <HexagonIcon
            size={12}
            color={highlight ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 13,
              color: highlight ? colors.foreground : colors.mutedForeground,
            }}
          >
            {pointsAmount.toLocaleString()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const me = useGetCurrentUser({ query: { staleTime: 60_000 } });
  const summary = useGetDashboardSummary({ query: { staleTime: 60_000 } });
  const activity = useGetDashboardActivity({ query: { staleTime: 60_000 } });
  const trending = useGetTrendingProducts({ query: { staleTime: 60_000 } });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      me.refetch(),
      summary.refetch(),
      activity.refetch(),
      trending.refetch(),
    ]);
    setRefreshing(false);
  }, [me, summary, activity, trending]);

  const isLoading = me.isLoading || summary.isLoading;
  const user = me.data;
  const sumData = summary.data;
  const trendingItems = (trending.data ?? []).slice(0, 4);
  const activityItems = (activity.data ?? []).slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 100,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              color: colors.mutedForeground,
              fontSize: 14,
            }}
          >
            Hey, welcome back
          </Text>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              fontSize: 22,
              marginTop: 2,
            }}
          >
            {user?.name?.split(" ")[0] ?? "—"}
          </Text>
        </View>
        <Avatar userId={user?.id ?? null} name={user?.name} size={44} />
      </View>

      {/* Hero balance */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius + 4,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <HexagonIcon size={14} color={colors.primaryForeground} />
          <Text
            style={[styles.heroLabel, { color: colors.primaryForeground }]}
          >
            POINTS BALANCE
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={[styles.heroValue, { color: colors.primaryForeground }]}>
            {(user?.pointsBalance ?? 0).toLocaleString()}
          </Text>
        )}
        <View style={styles.heroFooter}>
          <View style={styles.heroDelta}>
            <Feather
              name="trending-up"
              size={12}
              color={colors.primaryForeground}
            />
            <Text
              style={[styles.heroDeltaText, { color: colors.primaryForeground }]}
            >
              +{(sumData?.pointsEarned30d ?? 0).toLocaleString()} earned · 30d
            </Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickAction
          label="Shop"
          icon="shopping-bag"
          onPress={() => router.push("/(tabs)/marketplace")}
        />
        <QuickAction
          label="Inbox"
          icon="bell"
          onPress={() => router.push("/(tabs)/notifications")}
        />
        <QuickAction
          label="Profile"
          icon="user"
          onPress={() => router.push("/(tabs)/profile")}
        />
      </View>

      {/* Stats */}
      <View style={styles.statRow}>
        <StatCard
          label="Earned 30d"
          value={(sumData?.pointsEarned30d ?? 0).toLocaleString()}
          icon="trending-up"
          tint={colors.primary}
        />
        <StatCard
          label="Spent 30d"
          value={(sumData?.pointsSpent30d ?? 0).toLocaleString()}
          icon="trending-down"
          tint={colors.destructive}
        />
        <StatCard
          label="Coupons"
          value={sumData?.couponsOwned ?? 0}
          icon="tag"
          tint={colors.primary}
        />
      </View>

      {/* Trending */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Trending in the hive
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/marketplace")}>
          <Text
            style={{
              color: colors.foreground,
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
            }}
          >
            See all
          </Text>
        </Pressable>
      </View>
      {trending.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
      ) : trendingItems.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title="Nothing trending yet"
          body="Check back soon — the marketplace is buzzing."
        />
      ) : (
        <View style={styles.grid}>
          {trendingItems.map((p) => (
            <View key={p.id} style={styles.gridItem}>
              <ProductCard product={p} />
            </View>
          ))}
        </View>
      )}

      {/* Recent activity */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent activity
        </Text>
      </View>
      <View
        style={[
          styles.activityCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {activity.isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 24 }}
          />
        ) : activityItems.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No activity yet"
            body="Earn or spend points to see them here."
          />
        ) : (
          activityItems.map((a) => (
            <ActivityRow
              key={a.id}
              type={a.type}
              title={a.title}
              subtitle={a.subtitle}
              pointsAmount={a.pointsAmount ?? null}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  hero: {
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.85,
  },
  heroValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    lineHeight: 52,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroDelta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDeltaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    opacity: 0.9,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  qa: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
  },
  activityCard: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
