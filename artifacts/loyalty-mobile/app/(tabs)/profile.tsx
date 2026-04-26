import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { HexagonIcon } from "@/components/HexagonIcon";
import { PointsBadge } from "@/components/PointsBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useUpdateCurrentUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          color: colors.mutedForeground,
          letterSpacing: 0.5,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
            borderRadius: colors.radius,
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            minHeight: multiline ? 80 : 48,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { signOut } = useAuth();

  const me = useGetCurrentUser({ query: { staleTime: 60_000 } });
  const update = useUpdateCurrentUser();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (me.data && !dirty) {
      setName(me.data.name ?? "");
      setPhone(me.data.phone ?? "");
      setBio(me.data.bio ?? "");
    }
  }, [me.data, dirty]);

  const handleSave = () => {
    update.mutate(
      {
        data: {
          name: name.trim() || me.data?.name,
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setDirty(false);
          qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          if (Platform.OS === "web") {
            // Alert on web is polyfilled; use silent success.
          } else {
            Alert.alert("Saved", "Your profile has been updated.");
          }
        },
        onError: (err: any) => {
          Alert.alert("Couldn't save", err?.message ?? "Try again");
        },
      },
    );
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      signOut().then(() => router.replace("/login"));
      return;
    }
    Alert.alert("Sign out?", "You'll switch back to the identity picker.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  if (me.isLoading || !me.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const user = me.data;
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 120,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius + 4,
          },
        ]}
      >
        <Avatar userId={user.id} name={user.name} size={72} />
        <Text style={[styles.heroName, { color: colors.foreground }]}>
          {user.name}
        </Text>
        <Text style={[styles.heroEmail, { color: colors.mutedForeground }]}>
          {user.email}
        </Text>
        <View style={styles.heroRow}>
          <PointsBadge points={user.pointsBalance} size="md" />
          {user.role === "admin" ? (
            <View
              style={[
                styles.adminPill,
                { backgroundColor: colors.secondary },
              ]}
            >
              <FontAwesome6
                name="shield-halved"
                size={11}
                color={colors.secondaryForeground}
                solid
              />
              <Text
                style={{
                  color: colors.secondaryForeground,
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                }}
              >
                ADMIN
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.heroMember, { color: colors.mutedForeground }]}>
          Member since {memberSince}
        </Text>
      </View>

      {/* Editable form */}
      <View style={{ gap: 14 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Your details
        </Text>
        <Field
          label="Display name"
          value={name}
          onChange={(v) => {
            setName(v);
            setDirty(true);
          }}
          placeholder="Your name"
        />
        <Field
          label="Phone"
          value={phone}
          onChange={(v) => {
            setPhone(v);
            setDirty(true);
          }}
          placeholder="+1 555 123 4567"
          keyboardType="phone-pad"
        />
        <Field
          label="Bio"
          value={bio}
          onChange={(v) => {
            setBio(v);
            setDirty(true);
          }}
          placeholder="Tell the hive about yourself"
          multiline
        />
      </View>

      <PrimaryButton
        label={update.isPending ? "Saving…" : "Save changes"}
        onPress={handleSave}
        loading={update.isPending}
        disabled={!dirty || update.isPending}
        icon={
          <Feather
            name="check"
            size={16}
            color={colors.primaryForeground}
          />
        }
      />

      {/* Account actions */}
      <View
        style={[
          styles.linksCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push("/(tabs)/notifications")}
          style={({ pressed }) => [
            styles.linkRow,
            { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="bell" size={18} color={colors.foreground} />
          <Text style={[styles.linkLabel, { color: colors.foreground }]}>
            Notifications
          </Text>
          <Feather
            name="chevron-right"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/marketplace")}
          style={({ pressed }) => [
            styles.linkRow,
            { borderBottomWidth: 0, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="shopping-bag" size={18} color={colors.foreground} />
          <Text style={[styles.linkLabel, { color: colors.foreground }]}>
            Browse marketplace
          </Text>
          <Feather
            name="chevron-right"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>

      <PrimaryButton
        label="Sign out"
        variant="ghost"
        onPress={handleSignOut}
        icon={
          <Feather name="log-out" size={16} color={colors.foreground} />
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    padding: 24,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginTop: 4,
  },
  heroEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  heroRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    alignItems: "center",
  },
  adminPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroMember: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  linksCard: {
    borderWidth: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
});
