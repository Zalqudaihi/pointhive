import { FontAwesome6 } from "@expo/vector-icons";
import { useSignUp } from "@clerk/expo";
import { useRouter, Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HexagonIcon } from "@/components/HexagonIcon";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);

  const isLoading = fetchStatus === "fetching";

  const handleSignUp = async () => {
    if (!email || !password || !name) return;
    setError(null);
    try {
      const { error: signUpError } = await signUp.password({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });
      if (signUpError) {
        setError(signUpError.message ?? "Sign-up failed. Please try again.");
        return;
      }
      await signUp.verifications.sendEmailCode();
      setShowVerify(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-up failed. Please try again.";
      setError(msg);
    }
  };

  const handleVerify = async () => {
    setError(null);
    try {
      await signUp.verifications.verifyEmailCode({ code: verifyCode });
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");
            if (Platform.OS === "web" && url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.replace("/(tabs)");
            }
          },
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, Platform.OS === "web" ? { paddingTop: 24 } : null]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <HexagonIcon size={36} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.foreground }]}>PointHive</Text>
            <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
              Where loyalty buys you something real.
            </Text>
          </View>

          {showVerify ? (
            <View style={styles.form}>
              <Text style={[styles.h1, { color: colors.foreground }]}>Verify your email</Text>
              <Text style={[styles.h2, { color: colors.mutedForeground }]}>
                We sent a 6-digit code to {email}
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Verification code
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      color: colors.foreground,
                    },
                  ]}
                  value={verifyCode}
                  onChangeText={setVerifyCode}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  autoComplete="one-time-code"
                />
              </View>

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handleVerify}
                disabled={isLoading || !verifyCode}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: isLoading || !verifyCode ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                  {isLoading ? "Verifying…" : "Verify email"}
                </Text>
              </Pressable>

              <Pressable onPress={() => signUp.verifications.sendEmailCode()}>
                <Text style={[styles.linkText, { color: colors.primary, textAlign: "center" }]}>
                  Resend code
                </Text>
              </Pressable>

              <Pressable onPress={() => { setShowVerify(false); setVerifyCode(""); setError(null); }}>
                <Text style={[styles.linkText, { color: colors.mutedForeground, textAlign: "center" }]}>
                  ← Back
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={[styles.h1, { color: colors.foreground }]}>Create your account</Text>
              <Text style={[styles.h2, { color: colors.mutedForeground }]}>
                Join PointHive and start earning rewards
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Full name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      color: colors.foreground,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Jane Smith"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      color: colors.foreground,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      color: colors.foreground,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  autoComplete="new-password"
                  onSubmitEditing={handleSignUp}
                  returnKeyType="go"
                />
              </View>

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
              ) : null}

              <View nativeID="clerk-captcha" />

              <Pressable
                onPress={handleSignUp}
                disabled={isLoading || !email || !password || !name}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: isLoading || !email || !password || !name ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.btnInner}>
                    <FontAwesome6 name="circle-notch" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                      Creating account…
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    Create account
                  </Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                  Already have an account?{" "}
                </Text>
                <Link href="/login" asChild>
                  <Pressable>
                    <Text style={[styles.linkText, { color: colors.primary }]}>Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  form: {
    gap: 16,
  },
  h1: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 28,
  },
  h2: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: -8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
    fontFamily: "Inter_400Regular",
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: -4,
  },
  btn: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  linkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
