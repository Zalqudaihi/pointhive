import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { HexagonIcon } from "@/components/HexagonIcon";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import {
  useCreateProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey,
  type NewProduct,
  type CreateProductMutationError,
} from "@workspace/api-client-react";

type ListingType = "item" | "coupon";

export default function SellScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const createProduct = useCreateProduct();

  const [type, setType] = useState<ListingType>("item");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pointPrice, setPointPrice] = useState("100");
  const [stock, setStock] = useState("1");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountPct, setCouponDiscountPct] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = "Title must be at least 3 characters";
    if (description.trim().length < 10) e.description = "Description must be at least 10 characters";
    if (category.trim().length < 2) e.category = "Category is required";
    const price = Number(pointPrice);
    if (!Number.isInteger(price) || price < 1) e.pointPrice = "Price must be at least 1 pt";
    const qty = Number(stock);
    if (!Number.isInteger(qty) || qty < 1) e.stock = "Stock must be at least 1";
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) e.imageUrl = "Must be a valid URL (starting with http)";
    if (type === "coupon") {
      if (!couponCode.trim()) e.couponCode = "Coupon code is required";
      if (couponDiscountPct) {
        const pct = Number(couponDiscountPct);
        if (!Number.isInteger(pct) || pct < 1 || pct > 100) e.couponDiscountPct = "Discount must be 1–100";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: NewProduct = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      type,
      pointPrice: Number(pointPrice),
      stock: Number(stock),
    };
    if (imageUrl) payload.imageUrl = imageUrl.trim();
    if (type === "coupon") {
      payload.couponCode = couponCode.trim();
      if (couponDiscountPct) payload.couponDiscountPct = Number(couponDiscountPct);
    }

    createProduct.mutate(
      { data: payload },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          Alert.alert("Listing created!", "Your item is now live on the marketplace.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (err: CreateProductMutationError) => {
          Alert.alert("Failed to create listing", err.message ?? "Please try again.");
        },
      },
    );
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: {
      placeholder?: string;
      keyboardType?: "default" | "numeric" | "url";
      multiline?: boolean;
      error?: string;
      hint?: string;
    },
  ) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={opts?.placeholder ?? ""}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={opts?.keyboardType ?? "default"}
        multiline={opts?.multiline}
        numberOfLines={opts?.multiline ? 4 : 1}
        style={[
          styles.input,
          opts?.multiline && styles.inputMultiline,
          {
            color: colors.foreground,
            backgroundColor: colors.card,
            borderColor: opts?.error ? colors.destructive : colors.border,
            borderRadius: colors.radius,
            fontFamily: "Inter_400Regular",
          },
        ]}
      />
      {opts?.error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{opts.error}</Text>
      ) : opts?.hint ? (
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>{opts.hint}</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>List an Item</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LISTING TYPE</Text>
        <View style={styles.typeRow}>
          {(["item", "coupon"] as ListingType[]).map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                    flex: 1,
                  },
                ]}
              >
                <Feather
                  name={t === "item" ? "shopping-bag" : "tag"}
                  size={18}
                  color={active ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                    color: active ? colors.primaryForeground : colors.foreground,
                    marginTop: 4,
                  }}
                >
                  {t === "item" ? "Item" : "Coupon"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Core fields */}
        {field("TITLE *", title, setTitle, { placeholder: "e.g. Brand new jacket", error: errors.title })}
        {field("DESCRIPTION *", description, setDescription, {
          placeholder: "Describe what you're selling…",
          multiline: true,
          error: errors.description,
        })}
        {field("CATEGORY *", category, setCategory, { placeholder: "e.g. Clothing, Electronics…", error: errors.category })}
        {field("IMAGE URL", imageUrl, setImageUrl, {
          placeholder: "https://…",
          keyboardType: "url",
          error: errors.imageUrl,
          hint: "Optional — paste a public image URL",
        })}

        {/* Coupon extras */}
        {type === "coupon" ? (
          <View
            style={[
              styles.couponBox,
              { backgroundColor: colors.secondary + "33", borderColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <View style={styles.couponHeader}>
              <Feather name="tag" size={14} color={colors.secondaryForeground} />
              <Text style={[styles.couponHeaderText, { color: colors.secondaryForeground }]}>COUPON DETAILS</Text>
            </View>
            {field("COUPON CODE *", couponCode, setCouponCode, {
              placeholder: "e.g. SAVE20",
              error: errors.couponCode,
            })}
            {field("DISCOUNT %", couponDiscountPct, setCouponDiscountPct, {
              placeholder: "e.g. 20",
              keyboardType: "numeric",
              error: errors.couponDiscountPct,
            })}
          </View>
        ) : null}

        {/* Pricing */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>PRICING & STOCK</Text>

        <View style={[styles.pricingRow, { gap: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>POINTS PRICE *</Text>
            <View
              style={[
                styles.priceInput,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.pointPrice ? colors.destructive : colors.primary + "80",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <HexagonIcon size={16} color={colors.primary} />
              <TextInput
                value={pointPrice}
                onChangeText={setPointPrice}
                keyboardType="numeric"
                style={[
                  styles.priceText,
                  { color: colors.foreground, fontFamily: "Inter_700Bold" },
                ]}
              />
            </View>
            {errors.pointPrice ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.pointPrice}</Text>
            ) : null}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>STOCK *</Text>
            <TextInput
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: errors.stock ? colors.destructive : colors.border,
                  borderRadius: colors.radius,
                  fontFamily: "Inter_400Regular",
                },
              ]}
            />
            {errors.stock ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.stock}</Text>
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
          label={createProduct.isPending ? "Publishing…" : "Publish Listing"}
          onPress={handleSubmit}
          loading={createProduct.isPending}
          disabled={createProduct.isPending}
          icon={
            !createProduct.isPending ? (
              <Feather name="plus-circle" size={16} color={colors.primaryForeground} />
            ) : undefined
          }
        />
      </View>
    </KeyboardAvoidingView>
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
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeChip: {
    alignItems: "center",
    paddingVertical: 16,
    borderWidth: 1.5,
  },
  fieldWrap: { marginBottom: 16 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 4,
  },
  couponBox: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 0,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  couponHeaderText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  pricingRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceText: { fontSize: 20, flex: 1 },
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
