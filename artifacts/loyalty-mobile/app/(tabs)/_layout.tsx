import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

type TabConfig = {
  name: string;
  title: string;
  feather: React.ComponentProps<typeof Feather>["name"];
  sf: { default: string; selected: string };
};

const TABS: TabConfig[] = [
  {
    name: "index",
    title: "Home",
    feather: "home",
    sf: { default: "house", selected: "house.fill" },
  },
  {
    name: "marketplace",
    title: "Shop",
    feather: "shopping-bag",
    sf: { default: "bag", selected: "bag.fill" },
  },
  {
    name: "notifications",
    title: "Inbox",
    feather: "bell",
    sf: { default: "bell", selected: "bell.fill" },
  },
  {
    name: "profile",
    title: "Profile",
    feather: "user",
    sf: { default: "person", selected: "person.fill" },
  },
];

function NativeTabLayout() {
  return (
    <NativeTabs>
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <Icon sf={t.sf} />
          <Label>{t.title}</Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0.5,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView
                  name={focused ? (t.sf.selected as any) : (t.sf.default as any)}
                  tintColor={color}
                  size={24}
                />
              ) : (
                <Feather name={t.feather} size={22} color={color} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
