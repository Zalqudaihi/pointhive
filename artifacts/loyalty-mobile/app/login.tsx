import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HexagonIcon } from "@/components/HexagonIcon";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_IDENTITIES } from "@/constants/demoUsers";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useAuth();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleSelect = async (id: number) => {
    setLoadingId(id);
    try {
      await signIn(id);
      router.replace("/(tabs)");
    } catch {
      setLoadingId(null);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          Platform.OS === "web" ? { paddingTop: 24 } : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <HexagonIcon size={36} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.foreground }]}>
            PointHive
          </Text>
          <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
            Where loyalty buys you something real.
          </Text>
        </View>

        <View style={styles.heading}>
          <Text style={[styles.h1, { color: colors.foreground }]}>
            Pick a vibe to enter the hive
          </Text>
          <Text style={[styles.h2, { color: colors.mutedForeground }]}>
            Demo mode — choose any identity to explore.
          </Text>
        </View>

        <View style={styles.list}>
          {DEMO_IDENTITIES.map((u) => {
            const isLoading = loadingId === u.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => handleSelect(u.id)}
                disabled={loadingId != null}
                style={({ pressed }) => [
                  styles.userCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: loadingId != null && !isLoading ? 0.5 : pressed ? 0.94 : 1,
                    transform: pressed ? [{ scale: 0.99 }] : undefined,
                  },
                ]}
              >
                <Image
                  source={u.avatar}
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.muted },
                  ]}
                />
                <View style={styles.userMeta}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.userName, { color: colors.foreground }]}
                    >
                      {u.name}
                    </Text>
                    {u.role === "admin" ? (
                      <View
                        style={[
                          styles.rolePill,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rolePillText,
                            { color: colors.primaryForeground },
                          ]}
                        >
                          ADMIN
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.userTagline,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {u.tagline}
                  </Text>
                </View>
                <FontAwesome6
                  name={isLoading ? "circle-notch" : "arrow-right"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Real sign-in is coming. For now, every identity has its own balance,
          listings, and notifications.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 32,
  },
  brand: {
    alignItems: "center",
    gap: 10,
    marginTop: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
  },
  brandTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  heading: {
    gap: 6,
  },
  h1: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 28,
  },
  h2: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  userTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rolePillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 8,
  },
});
