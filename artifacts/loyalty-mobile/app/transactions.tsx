import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HexagonIcon } from "@/components/HexagonIcon";
import { useColors } from "@/hooks/useColors";
import {
  useListTransactions,
  useGetCurrentUser,
  type Transaction,
} from "@workspace/api-client-react";

type TxType = "purchase" | "transfer" | "exchange";

const TYPE_ICONS: Record<TxType, React.ComponentProps<typeof Feather>["name"]> =
  {
    purchase: "shopping-bag",
    transfer: "send",
    exchange: "repeat",
  };

const TYPE_LABELS: Record<TxType, string> = {
  purchase: "Purchase",
  transfer: "Transfer",
  exchange: "Exchange",
};

function typeIconBg(type: TxType, colors: ReturnType<typeof useColors>) {
  if (type === "purchase") return colors.primary + "28";
  if (type === "transfer") return "#3B82F628";
  return "#F9731628";
}

function typeIconColor(type: TxType, colors: ReturnType<typeof useColors>) {
  if (type === "purchase") return colors.primary;
  if (type === "transfer") return "#3B82F6";
  return "#F97316";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function buildDescription(
  tx: Transaction,
  userId: number | undefined
): string {
  if (tx.type === "purchase") {
    const isBuyer = userId != null && tx.buyerId === userId;
    if (isBuyer) {
      return tx.productTitle
        ? `Bought "${tx.productTitle}"${tx.sellerName ? ` from ${tx.sellerName}` : ""}`
        : "Bought an item";
    }
    return tx.productTitle
      ? `Sold "${tx.productTitle}"${tx.buyerName ? ` to ${tx.buyerName}` : ""}`
      : "Sold an item";
  }
  if (tx.type === "transfer") {
    const isSender = userId != null && tx.sellerId === userId;
    if (isSender) {
      return tx.buyerName ? `Sent to ${tx.buyerName}` : "Sent points";
    }
    return tx.sellerName ? `Received from ${tx.sellerName}` : "Received points";
  }
  return "System exchange";
}

function isOutgoing(tx: Transaction, userId: number | undefined): boolean {
  if (tx.type === "purchase") return userId != null && tx.buyerId === userId;
  if (tx.type === "transfer") return userId != null && tx.sellerId === userId;
  return false;
}

function StatusBadge({
  status,
  colors,
}: {
  status: Transaction["status"];
  colors: ReturnType<typeof useColors>;
}) {
  const bg =
    status === "completed"
      ? colors.primary + "22"
      : status === "pending"
        ? colors.secondary
        : colors.destructive + "22";
  const fg =
    status === "completed"
      ? colors.primary
      : status === "pending"
        ? colors.secondaryForeground
        : colors.destructive;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

function TxRow({
  tx,
  userId,
  colors,
  onPress,
}: {
  tx: Transaction;
  userId: number | undefined;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const out = isOutgoing(tx, userId);
  const amountColor = out ? colors.destructive : colors.primary;
  const prefix = out ? "−" : "+";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          backgroundColor: pressed ? colors.muted : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: typeIconBg(tx.type as TxType, colors) },
        ]}
      >
        <Feather
          name={TYPE_ICONS[tx.type as TxType] ?? "activity"}
          size={18}
          color={typeIconColor(tx.type as TxType, colors)}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>
            {TYPE_LABELS[tx.type as TxType] ?? tx.type}
          </Text>
          <StatusBadge status={tx.status} colors={colors} />
        </View>
        <Text
          style={[styles.rowDesc, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {buildDescription(tx, userId)}
        </Text>
      </View>

      <View style={styles.rowRight}>
        <View style={styles.amountRow}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {prefix}
            {tx.pointsAmount.toLocaleString()}
          </Text>
          <HexagonIcon size={11} color={amountColor} />
        </View>
        <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
          {relativeTime(tx.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function TxDetailModal({
  tx,
  userId,
  colors,
  onClose,
}: {
  tx: Transaction;
  userId: number | undefined;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
}) {
  const out = isOutgoing(tx, userId);
  const amountColor = out ? colors.destructive : colors.primary;
  const prefix = out ? "−" : "+";

  const rows: { label: string; value: string }[] = [];

  if (tx.type === "purchase") {
    if (tx.productTitle) rows.push({ label: "Product", value: tx.productTitle });
    if (tx.sellerName) rows.push({ label: "Seller", value: tx.sellerName });
    if (tx.buyerName) rows.push({ label: "Buyer", value: tx.buyerName });
  } else if (tx.type === "transfer") {
    if (tx.sellerName) rows.push({ label: "From", value: tx.sellerName });
    if (tx.buyerName) rows.push({ label: "To", value: tx.buyerName });
  }

  if (tx.note) rows.push({ label: "Note", value: tx.note });

  rows.push({
    label: "Date",
    value: new Date(tx.createdAt).toLocaleString(),
  });

  rows.push({ label: "ID", value: `#${tx.id}` });

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View
        style={[
          styles.modalSheet,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

        <View style={styles.modalHeader}>
          <View
            style={[
              styles.modalIcon,
              { backgroundColor: typeIconBg(tx.type as TxType, colors) },
            ]}
          >
            <Feather
              name={TYPE_ICONS[tx.type as TxType] ?? "activity"}
              size={24}
              color={typeIconColor(tx.type as TxType, colors)}
            />
          </View>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {TYPE_LABELS[tx.type as TxType] ?? tx.type}
          </Text>
          <StatusBadge status={tx.status} colors={colors} />
        </View>

        <View style={styles.modalAmount}>
          <Text style={[styles.modalAmountText, { color: amountColor }]}>
            {prefix}
            {tx.pointsAmount.toLocaleString()}
          </Text>
          <HexagonIcon size={22} color={amountColor} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {rows.map((r) => (
          <View key={r.label} style={styles.detailRow}>
            <Text
              style={[styles.detailLabel, { color: colors.mutedForeground }]}
            >
              {r.label}
            </Text>
            <Text
              style={[styles.detailValue, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {r.value}
            </Text>
          </View>
        ))}

        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
        >
          <Text
            style={[
              styles.closeBtnText,
              { color: colors.secondaryForeground },
            ]}
          >
            Close
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const FILTERS: { label: string; value: TxType | null }[] = [
  { label: "All", value: null },
  { label: "Purchases", value: "purchase" },
  { label: "Transfers", value: "transfer" },
  { label: "System", value: "exchange" },
];

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filter, setFilter] = useState<TxType | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data: user } = useGetCurrentUser({ query: { staleTime: 60_000 } });
  const { data: transactions, isLoading, refetch, isRefetching } =
    useListTransactions(
      filter != null ? { type: filter } : undefined,
      { query: { staleTime: 30_000 } }
    );

  const userId = user?.id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Transactions
        </Text>
        <Pressable onPress={() => refetch()} hitSlop={12} style={styles.backBtn}>
          <Feather
            name="refresh-cw"
            size={18}
            color={isRefetching ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={String(f.value)}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primary : colors.secondary,
                  borderRadius: 999,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color: active
                      ? colors.primaryForeground
                      : colors.secondaryForeground,
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !transactions || transactions.length === 0 ? (
        <View style={styles.center}>
          <Feather
            name="activity"
            size={48}
            color={colors.mutedForeground}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No transactions yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Your point movements will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(tx) => String(tx.id)}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 32,
          }}
          style={[
            styles.list,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          renderItem={({ item }) => (
            <TxRow
              tx={item}
              userId={userId}
              colors={colors}
              onPress={() => setSelected(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selected != null && (
        <TxDetailModal
          tx={selected}
          userId={userId}
          colors={colors}
          onClose={() => setSelected(null)}
        />
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
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
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
  list: {
    flex: 1,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  rowDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 1,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  amountText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  timeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    flex: 1,
  },
  modalAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  modalAmountText: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 16,
  },
  detailLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  detailValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
