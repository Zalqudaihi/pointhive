import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { useColors } from "@/hooks/useColors";
import { useListProducts } from "@workspace/api-client-react";

type Filter = "all" | "item" | "coupon";

const FILTERS: { key: Filter; label: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { key: "all", label: "All", icon: "grid" },
  { key: "item", label: "Items", icon: "shopping-bag" },
  { key: "coupon", label: "Coupons", icon: "tag" },
];

export default function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const params: { type?: "item" | "coupon"; search?: string; status?: "active" } = {
    status: "active",
  };
  if (filter !== "all") params.type = filter;
  const trimmed = search.trim();
  if (trimmed) params.search = trimmed;

  const products = useListProducts(params, { query: { staleTime: 30_000 } });

  const onRefresh = async () => {
    setRefreshing(true);
    await products.refetch();
    setRefreshing(false);
  };

  const data = useMemo(() => products.data ?? [], [products.data]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Marketplace
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Spend points on real stuff & exclusive coupons.
        </Text>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search listings"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.searchInput,
            {
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: 999,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather
                name={f.icon}
                size={13}
                color={isActive ? colors.primaryForeground : colors.foreground}
              />
              <Text
                style={{
                  color: isActive ? colors.primaryForeground : colors.foreground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Grid */}
      {products.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon="shopping-bag"
            title="No listings match"
            body={
              trimmed
                ? `Nothing for “${trimmed}” yet. Try a different search.`
                : "Pull to refresh or check back later."
            }
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
            paddingTop: 4,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} />
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13 },
  searchWrap: {
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 48,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
