import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, getCurrentUserIdHeader, useAuth } from "@/contexts/AuthContext";
import { setBaseUrl, setUserIdGetter } from "@workspace/api-client-react";

// Wire the API client to the live Express backend.
//   - On web: relative URL (proxied by the workspace).
//   - On native: full https URL via EXPO_PUBLIC_DOMAIN at build time.
const apiBase = (() => {
  if (Platform.OS === "web") return "";
  const dom = process.env.EXPO_PUBLIC_DOMAIN;
  return dom ? `https://${dom}` : "";
})();
setBaseUrl(apiBase);
setUserIdGetter(() => getCurrentUserIdHeader());

// Prevent the splash screen from auto-hiding before assets are ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { userId, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthFlow = segments[0] === "login";
    if (!userId && !inAuthFlow) {
      router.replace("/login");
    } else if (userId && inAuthFlow) {
      router.replace("/(tabs)");
    }
  }, [ready, userId, segments, router]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#FAF8F2" }} />;
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
          headerBackTitle: "Back",
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AuthGate>
                  <RootLayoutNav />
                </AuthGate>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
