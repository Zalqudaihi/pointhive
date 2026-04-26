import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { HexagonIcon } from "@/components/HexagonIcon";
import { useColors } from "@/hooks/useColors";
import {
  useGetCurrentUser,
  useListProducts,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey,
  type Product,
} from "@workspace/api-client-react";

function StatusPill({ status, colors }: { status: string; colors: ReturnType<typeof useColors> }) {
  const bgColor =
    status === "active"
      ? colors.primary + "22"
      : status === "draft"
        ? colors.secondary + "44"
        : colors.mutedForeground + "22";
  const textColor =
    status === "active"
      ? colors.primary
      : status === "draft"
        ? colors.mutedForeground
        : colors.mutedForeground;
  return (
    <View style={[styles.pill, { backgroundColor: bgColor }]}>
      <Text style={[styles.pillText, { color: textColor }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

function ListingRow({
  product,
  colors,
  onEdit,
  onDelete,
}: {
  product: Product;
  colors: ReturnType<typeof useColors>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.rowContent}>
        <View style={styles.rowMain}>
          <Text
            style={[styles.rowTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <View style={styles.rowMeta}>
            <StatusPill status={product.status} colors={colors} />
            <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
              {product.stock} in stock
            </Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          <View style={styles.priceRow}>
            <HexagonIcon size={13} color={colors.primary} />
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {product.pointPrice.toLocaleString()}
            </Text>
          </View>
          <View style={styles.rowActions}>
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Feather name="trash-2" size={17} color={colors.destructive} />
            </Pressable>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function MyListingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: user } = useGetCurrentUser({ query: { staleTime: 60_000 } });

  const { data: products, isLoading, refetch } = useListProducts(
    { sellerId: user?.id },
    {
      query: {
        queryKey: getListProductsQueryKey({ sellerId: user?.id }),
        enabled: !!user?.id,
      },
    },
  );

  const deleteProduct = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const confirmDelete = (product: Product) => {
    const doDelete = async () => {
      setDeletingId(product.id);
      try {
        await deleteProduct.mutateAsync({ id: product.id });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      } catch (err: any) {
        Alert.alert("Couldn't delete", err?.message ?? "Please try again.");
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Remove listing?\n"${product.title}" will be permanently removed from the marketplace.`)) {
        doDelete();
      }
      return;
    }
    Alert.alert(
      "Remove listing?",
      `"${product.title}" will be permanently removed from the marketplace.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doDelete },
      ],
    );
  };

  const isEmpty = !isLoading && (!products || products.length === 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>My Listings</Text>
        <Pressable
          onPress={() => router.push("/sell")}
          hitSlop={8}
          style={styles.addBtn}
        >
          <Feather name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Feather name="package" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No listings yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Tap the + button above to create your first listing.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 32,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
        >
          {products!.map((product) => (
            <View key={product.id} style={{ opacity: deletingId === product.id ? 0.4 : 1 }}>
              <ListingRow
                product={product}
                colors={colors}
                onEdit={() => router.push(`/edit-listing/${product.id}`)}
                onDelete={() => confirmDelete(product)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  row: {
    borderWidth: 1,
    overflow: "hidden",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
