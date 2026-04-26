import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PointsBadge } from "@/components/PointsBadge";
import { useColors } from "@/hooks/useColors";
import type { Product } from "@workspace/api-client-react";

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
  // Web seed images live at /seed/<key>.png; map them to bundled assets.
  const match = imageUrl.match(/\/seed\/([a-z-]+)\.png/i);
  if (match && SEED_IMAGES[match[1]]) return SEED_IMAGES[match[1]];
  if (/^https?:\/\//.test(imageUrl)) return { uri: imageUrl };
  return null;
}

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const colors = useColors();
  const router = useRouter();
  const source = resolveImage(product.imageUrl);
  const isCoupon = product.type === "coupon";

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.92 : 1,
          transform: pressed ? [{ scale: 0.99 }] : undefined,
        },
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          { backgroundColor: colors.muted, borderRadius: colors.radius - 4 },
        ]}
      >
        {source ? (
          <Image source={source} style={styles.image} contentFit="cover" />
        ) : (
          <Feather
            name={isCoupon ? "tag" : "shopping-bag"}
            size={36}
            color={colors.mutedForeground}
          />
        )}
        {isCoupon ? (
          <View style={[styles.couponPill, { backgroundColor: colors.secondary }]}>
            <Feather name="tag" size={10} color={colors.secondaryForeground} />
            <Text
              style={{
                color: colors.secondaryForeground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
              }}
            >
              COUPON
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            color: colors.foreground,
          }}
        >
          {product.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: colors.mutedForeground,
            marginTop: 2,
          }}
        >
          @{product.sellerName}
        </Text>
        <View style={styles.footer}>
          <PointsBadge points={product.pointPrice} size="sm" />
          {product.stock > 0 ? null : (
            <Text
              style={{
                color: colors.destructive,
                fontFamily: "Inter_500Medium",
                fontSize: 11,
              }}
            >
              Sold out
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  imageWrap: {
    aspectRatio: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  couponPill: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  body: {
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
