import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { Avatar } from "@/components/Avatar";
import { HexagonIcon } from "@/components/HexagonIcon";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import {
  useListUsers,
  useCreateTransfer,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
  type CreateTransferMutationError,
} from "@workspace/api-client-react";

export default function TransferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();

  const me = useGetCurrentUser({ query: { staleTime: 60_000 } });
  const createTransfer = useCreateTransfer();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");

  const { data: users, isLoading: loadingUsers } = useListUsers(
    { search: search || undefined },
    { query: { staleTime: 10_000 } },
  );

  const myId = me.data?.id;
  const balance = me.data?.pointsBalance ?? 0;
  const filteredUsers = (users ?? []).filter((u) => u.id !== myId);
  const selectedUser = filteredUsers.find((u) => u.id === selectedId);

  React.useEffect(() => {
    if (selectedId !== null && !filteredUsers.find((u) => u.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredUsers, selectedId]);

  const validate = (): boolean => {
    const pts = Number(amount);
    if (!Number.isInteger(pts) || pts < 1) {
      setAmountError("Must be at least 1 point");
      return false;
    }
    if (pts > balance) {
      setAmountError(`You only have ${balance.toLocaleString()} pts`);
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleSend = () => {
    if (!selectedId) {
      Alert.alert("No recipient", "Please select someone to send points to.");
      return;
    }
    if (!validate()) return;

    const pts = Number(amount);
    Alert.alert(
      "Confirm transfer",
      `Send ${pts.toLocaleString()} pts to ${selectedUser?.name ?? "recipient"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "default",
          onPress: () => {
            createTransfer.mutate(
              { data: { recipientId: selectedId, pointsAmount: pts, note: note.trim() || undefined } },
              {
                onSuccess: () => {
                  qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
                  qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
                  qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
                  Alert.alert(
                    "Points sent!",
                    `${pts.toLocaleString()} pts transferred to ${selectedUser?.name ?? "recipient"}.`,
                    [{ text: "OK", onPress: () => router.back() }],
                  );
                },
                onError: (err: CreateTransferMutationError) => {
                  Alert.alert("Transfer failed", err.message ?? "Please try again.");
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Transfer Points</Text>
        <View style={{ width: 34 }} />
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
        {/* Balance banner */}
        <View
          style={[
            styles.balanceBanner,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <HexagonIcon size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Your balance</Text>
            <Text style={[styles.balanceValue, { color: colors.foreground }]}>
              {balance.toLocaleString()} pts
            </Text>
          </View>
        </View>

        {/* Step 1: pick recipient */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
          1. CHOOSE RECIPIENT
        </Text>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.userList,
            { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card + "80" },
          ]}
        >
          {loadingUsers ? (
            <ActivityIndicator color={colors.primary} style={{ padding: 24 }} />
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyUsers}>
              <Feather name="users" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyUsersText, { color: colors.mutedForeground }]}>
                {search ? "No users match your search" : "No other users found"}
              </Text>
            </View>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = u.id === selectedId;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => setSelectedId(u.id)}
                  style={[
                    styles.userRow,
                    {
                      backgroundColor: isSelected ? colors.primary + "18" : "transparent",
                      borderColor: isSelected ? colors.primary + "60" : "transparent",
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Avatar userId={u.id} name={u.name} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{u.name}</Text>
                    {u.email ? (
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={12} color={colors.primaryForeground} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>

        {/* Step 2: amount */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>
          2. AMOUNT
        </Text>

        <View
          style={[
            styles.amountWrap,
            {
              backgroundColor: colors.card,
              borderColor: amountError ? colors.destructive : colors.primary + "80",
              borderRadius: colors.radius,
            },
          ]}
        >
          <HexagonIcon size={20} color={colors.primary} />
          <TextInput
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setAmountError("");
            }}
            keyboardType="numeric"
            style={[styles.amountInput, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={[styles.ptsLabel, { color: colors.mutedForeground }]}>pts</Text>
        </View>
        {amountError ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{amountError}</Text>
        ) : null}

        {/* Quick amounts */}
        <View style={styles.quickAmounts}>
          {[10, 25, 50, 100].map((q) => (
            <Pressable
              key={q}
              onPress={() => {
                setAmount(String(q));
                setAmountError("");
              }}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  backgroundColor: Number(amount) === q ? colors.primary : colors.card,
                  borderColor: Number(amount) === q ? colors.primary : colors.border,
                  borderRadius: 999,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: Number(amount) === q ? colors.primaryForeground : colors.foreground,
                }}
              >
                {q} pts
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Optional note */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
          3. NOTE (OPTIONAL)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a message…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          style={[
            styles.noteInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              fontFamily: "Inter_400Regular",
            },
          ]}
        />
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
        {selectedUser ? (
          <Text style={[styles.sendingTo, { color: colors.mutedForeground }]}>
            Sending to{" "}
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
              {selectedUser.name}
            </Text>
          </Text>
        ) : null}
        <PrimaryButton
          label={createTransfer.isPending ? "Sending…" : "Send Points"}
          onPress={handleSend}
          loading={createTransfer.isPending}
          disabled={createTransfer.isPending || !selectedId || me.isLoading}
          icon={
            !createTransfer.isPending ? (
              <Feather name="send" size={16} color={colors.primaryForeground} />
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
  balanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
  balanceLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  balanceValue: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 2 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, height: 48 },
  userList: {
    borderWidth: 1,
    maxHeight: 280,
    overflow: "hidden",
  },
  emptyUsers: {
    alignItems: "center",
    padding: 32,
    gap: 10,
  },
  emptyUsersText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    margin: 4,
  },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountInput: { flex: 1, fontSize: 28, letterSpacing: -0.5 },
  ptsLabel: { fontFamily: "Inter_500Medium", fontSize: 16 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  noteInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    height: 80,
    textAlignVertical: "top",
  },
  sendingTo: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
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
