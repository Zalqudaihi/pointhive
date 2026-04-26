import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const apiBase = (() => {
  if (Platform.OS === "web") return "";
  const dom = process.env.EXPO_PUBLIC_DOMAIN;
  return dom ? `https://${dom}` : "";
})();
setBaseUrl(apiBase);

SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthFlow =
      segments[0] === "login" ||
      segments[0] === "sign-up" ||
      segments[0] === "forgot-password";
    if (!isSignedIn && !inAuthFlow) {
      router.replace("/login");
    } else if (isSignedIn && inAuthFlow) {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: "#FAF8F2" }} />;
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
        name="sign-up"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: false, animation: "slide_from_right" }}
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
      <Stack.Screen
        name="sell"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="transfer"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="my-listings"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="edit-listing/[id]"
        options={{
          headerShown: false,
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
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <AuthGate>
                    <RootLayoutNav />
                  </AuthGate>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
