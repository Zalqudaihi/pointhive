import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  useGetProduct,
  useUpdateProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetProductQueryKey,
  type ProductUpdate,
  ProductUpdateStatus,
} from "@workspace/api-client-react";

export default function EditListingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: { staleTime: 0, enabled: !Number.isNaN(productId) },
  });

  const updateProduct = useUpdateProduct();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pointPrice, setPointPrice] = useState("");
  const [stock, setStock] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (product && !initialized) {
      setTitle(product.title ?? "");
      setDescription(product.description ?? "");
      setCategory(product.category ?? "");
      setImageUrl(product.imageUrl ?? "");
      setPointPrice(String(product.pointPrice));
      setStock(String(product.stock));
      setInitialized(true);
    }
  }, [product, initialized]);

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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const payload: ProductUpdate = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      pointPrice: Number(pointPrice),
      stock: Number(stock),
      imageUrl: imageUrl.trim() || null,
    };

    updateProduct.mutate(
      { id: productId, data: payload },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          qc.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
          Alert.alert("Changes saved!", "Your listing has been updated.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (err: any) => {
          Alert.alert("Couldn't save", err?.message ?? "Please try again.");
        },
      },
    );
  };

  const handleToggleDraft = () => {
    if (!product) return;
    const newStatus =
      product.status === "active"
        ? ProductUpdateStatus.draft
        : ProductUpdateStatus.active;
    const doToggle = () => {
      updateProduct.mutate(
        { id: productId, data: { status: newStatus } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
            qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            qc.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
            router.back();
          },
          onError: (err: any) => {
            Alert.alert("Couldn't update", err?.message ?? "Please try again.");
          },
        },
      );
    };

    const title = newStatus === "active" ? "Re-list?" : "Delist?";
    const message =
      newStatus === "active"
        ? "This listing will become visible in the marketplace again."
        : "This listing will be hidden from the marketplace. You can re-list it later.";
    const confirmLabel = newStatus === "active" ? "Re-list" : "Delist";

    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n${message}`)) doToggle();
      return;
    }
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: confirmLabel, onPress: doToggle },
    ]);
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

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
        <Text style={[{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 6 }]}>
          Listing not found
        </Text>
        <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, textAlign: "center" }]}>
          This listing may have been deleted or is no longer available.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isDraft = product.status === "draft";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Edit Listing</Text>
        <Pressable
          onPress={handleToggleDraft}
          hitSlop={8}
          style={styles.delistBtn}
          disabled={updateProduct.isPending}
        >
          <Feather
            name={isDraft ? "eye" : "eye-off"}
            size={20}
            color={isDraft ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isDraft && (
          <View
            style={[
              styles.draftBanner,
              { backgroundColor: colors.secondary + "33", borderColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <Feather name="eye-off" size={14} color={colors.mutedForeground} />
            <Text style={[styles.draftText, { color: colors.mutedForeground }]}>
              This listing is hidden. Tap the eye icon to re-list it.
            </Text>
          </View>
        )}

        {field("TITLE *", title, setTitle, { placeholder: "e.g. Brand new jacket", error: errors.title })}
        {field("DESCRIPTION *", description, setDescription, {
          placeholder: "Describe what you're selling…",
          multiline: true,
          error: errors.description,
        })}
        {field("CATEGORY *", category, setCategory, {
          placeholder: "e.g. Clothing, Electronics…",
          error: errors.category,
        })}
        {field("IMAGE URL", imageUrl, setImageUrl, {
          placeholder: "https://…",
          keyboardType: "url",
          error: errors.imageUrl,
          hint: "Optional — paste a public image URL",
        })}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
          PRICING & STOCK
        </Text>
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
                style={[styles.priceText, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
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
          label={updateProduct.isPending ? "Saving…" : "Save changes"}
          onPress={handleSave}
          loading={updateProduct.isPending}
          disabled={updateProduct.isPending}
          icon={
            !updateProduct.isPending ? (
              <Feather name="check" size={16} color={colors.primaryForeground} />
            ) : undefined
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  delistBtn: { padding: 4 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  draftText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
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
