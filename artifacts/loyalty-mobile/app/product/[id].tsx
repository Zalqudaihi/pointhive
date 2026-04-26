import { Feather } from "@expo/vector-icons";

import { HexagonIcon } from "@/components/HexagonIcon";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PointsBadge } from "@/components/PointsBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import {
  getGetCurrentUserQueryKey,
  getGetProductQueryKey,
  getListProductsQueryKey,
  useCreatePurchase,
  useGetCurrentUser,
  useGetProduct,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SEED_IMAGES: Record<string, ReturnType<typeof require>> = {
  jacket: require("@/assets/seed/jacket.png"),
  headphones: require("@/assets/seed/headphones.png"),
  mug: require("@/assets/seed/mug.png"),
  plant: require("@/assets/seed/plant.png"),
  "coupon-coffee": require("@/assets/seed/coupon-coffee.png"),
  "coupon-streetwear": require("@/assets/seed/coupon-streetwear.png"),
};

function resolveImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/seed\/([a-z-]+)\.png/i);
  if (match && SEED_IMAGES[match[1]]) return SEED_IMAGES[match[1]];
  if (/^https?:\/\//.test(imageUrl)) return { uri: imageUrl };
  return null;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const product = useGetProduct(productId, {
    query: { enabled: Number.isFinite(productId) && productId > 0 },
  });
  const me = useGetCurrentUser({ query: { staleTime: 60_000 } });
  const purchase = useCreatePurchase();

  const [confirming, setConfirming] = useState(false);

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState icon="alert-circle" title="Invalid listing" />
      </View>
    );
  }

  if (product.isLoading || !product.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {product.isError ? (
          <EmptyState
            icon="alert-circle"
            title="Couldn't load this listing"
            body="It may have been removed."
          />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    );
  }

  const p = product.data;
  const balance = me.data?.pointsBalance ?? 0;
  const isCoupon = p.type === "coupon";
  const isOwn = me.data?.id === p.sellerId;
  const inStock = p.stock > 0;
  const canAfford = balance >= p.pointPrice;
  const buyDisabled =
    confirming || purchase.isPending || isOwn || !inStock || !canAfford;
  const source = resolveImage(p.imageUrl);

  let buyLabel = `Buy for ${p.pointPrice.toLocaleString()} pts`;
  if (isOwn) buyLabel = "This is your listing";
  else if (!inStock) buyLabel = "Sold out";
  else if (!canAfford)
    buyLabel = `Need ${(p.pointPrice - balance).toLocaleString()} more pts`;

  const doPurchase = () => {
    purchase.mutate(
      { data: { productId: p.id, quantity: 1 } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          qc.invalidateQueries({ queryKey: getGetProductQueryKey(p.id) });
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          if (Platform.OS !== "web") {
            Alert.alert("Purchase complete", "Your points have been deducted.");
          }
          router.back();
        },
        onError: (err: any) => {
          Alert.alert(
            "Purchase failed",
            err?.message ?? "Please try again",
          );
        },
      },
    );
  };

  const handleBuy = () => {
    if (buyDisabled) return;
    if (Platform.OS === "web") {
      doPurchase();
      return;
    }
    setConfirming(true);
    Alert.alert(
      "Confirm purchase",
      `Spend ${p.pointPrice.toLocaleString()} points on “${p.title}”?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setConfirming(false) },
        {
          text: "Buy now",
          style: "default",
          onPress: () => {
            setConfirming(false);
            doPurchase();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.muted, paddingTop: insets.top + 48 },
          ]}
        >
          {source ? (
            <Image source={source} style={styles.heroImage} contentFit="cover" />
          ) : (
            <Feather
              name={isCoupon ? "tag" : "shopping-bag"}
              size={72}
              color={colors.mutedForeground}
            />
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.typePillRow}>
                <View
                  style={[
                    styles.typePill,
                    { backgroundColor: isCoupon ? colors.secondary : colors.muted },
                  ]}
                >
                  <Feather
                    name={isCoupon ? "tag" : "shopping-bag"}
                    size={11}
                    color={
                      isCoupon
                        ? colors.secondaryForeground
                        : colors.mutedForeground
                    }
                  />
                  <Text
                    style={{
                      color: isCoupon
                        ? colors.secondaryForeground
                        : colors.mutedForeground,
                      fontFamily: "Inter_700Bold",
                      fontSize: 10,
                      letterSpacing: 0.5,
                    }}
                  >
                    {isCoupon ? "COUPON" : "ITEM"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {p.title}
              </Text>
            </View>
          </View>

          <PointsBadge points={p.pointPrice} size="lg" style={{ marginTop: 12 }} />

          {/* Seller */}
          <View
            style={[
              styles.sellerCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Avatar userId={p.sellerId} name={p.sellerName} size={40} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  color: colors.mutedForeground,
                  letterSpacing: 0.5,
                }}
              >
                LISTED BY
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 15,
                  color: colors.foreground,
                  marginTop: 2,
                }}
              >
                {p.sellerName}
              </Text>
            </View>
            <View style={styles.stockBadge}>
              <Feather
                name="package"
                size={12}
                color={
                  inStock ? colors.mutedForeground : colors.destructive
                }
              />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                  color: inStock
                    ? colors.mutedForeground
                    : colors.destructive,
                }}
              >
                {inStock ? `${p.stock} left` : "Sold out"}
              </Text>
            </View>
          </View>

          {/* Description */}
          {p.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                ABOUT THIS LISTING
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  color: colors.foreground,
                  lineHeight: 22,
                  marginTop: 6,
                }}
              >
                {p.description}
              </Text>
            </View>
          ) : null}

          {/* Wallet snapshot */}
          <View
            style={[
              styles.walletRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <HexagonIcon size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  color: colors.mutedForeground,
                }}
              >
                Your balance
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                  color: colors.foreground,
                  marginTop: 2,
                }}
              >
                {balance.toLocaleString()} pts
              </Text>
            </View>
            {canAfford ? (
              <View
                style={[styles.affordPill, { backgroundColor: colors.secondary }]}
              >
                <Feather
                  name="check"
                  size={12}
                  color={colors.secondaryForeground}
                />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    color: colors.secondaryForeground,
                  }}
                >
                  You can afford this
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.ctaWrap,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <PrimaryButton
          label={purchase.isPending ? "Processing…" : buyLabel}
          onPress={handleBuy}
          loading={purchase.isPending}
          disabled={buyDisabled}
          icon={
            !buyDisabled ? (
              <Feather
                name="zap"
                size={16}
                color={colors.primaryForeground}
              />
            ) : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    aspectRatio: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  typePillRow: { flexDirection: "row", marginBottom: 8 },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    lineHeight: 32,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginTop: 20,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  section: { marginTop: 24 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  affordPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ctaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
