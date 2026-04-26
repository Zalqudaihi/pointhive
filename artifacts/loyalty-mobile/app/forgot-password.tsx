import { FontAwesome6 } from "@expo/vector-icons";
import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
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

type Step = "email" | "verify" | "password" | "done";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isLoading = fetchStatus === "fetching";

  const handleSendCode = async () => {
    if (!email) return;
    setError(null);
    try {
      const { error: createError } = await signIn.create({ identifier: email });
      if (createError) {
        setError(createError.message ?? "Could not find an account with that email.");
        return;
      }
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(sendError.message ?? "Failed to send reset code. Please try again.");
        return;
      }
      setStep("verify");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send reset code.";
      setError(msg);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return;
    setError(null);
    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid code. Please try again.");
        return;
      }
      setStep("password");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    try {
      const { error: pwError } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });
      if (pwError) {
        setError(pwError.message ?? "Failed to set new password. Please try again.");
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");
            if (Platform.OS === "web" && url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.replace("/(tabs)");
            }
          },
        });
      } else {
        setStep("done");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to set password.";
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
          </View>

          {step === "done" ? (
            <View style={styles.form}>
              <Text style={[styles.h1, { color: colors.foreground }]}>Password updated</Text>
              <Text style={[styles.h2, { color: colors.mutedForeground }]}>
                Your password has been reset. You can now sign in with your new password.
              </Text>
              <Pressable
                onPress={() => router.replace("/login")}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                  Back to sign in
                </Text>
              </Pressable>
            </View>
          ) : step === "password" ? (
            <View style={styles.form}>
              <Text style={[styles.h1, { color: colors.foreground }]}>Set new password</Text>
              <Text style={[styles.h2, { color: colors.mutedForeground }]}>
                Choose a strong password for your account.
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>New password</Text>
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
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Confirm new password
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  autoComplete="new-password"
                  onSubmitEditing={handleSetPassword}
                  returnKeyType="go"
                />
              </View>

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handleSetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity:
                      isLoading || !newPassword || !confirmPassword ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.btnInner}>
                    <FontAwesome6 name="circle-notch" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                      Saving…
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    Set new password
                  </Text>
                )}
              </Pressable>
            </View>
          ) : step === "verify" ? (
            <View style={styles.form}>
              <Text style={[styles.h1, { color: colors.foreground }]}>Check your email</Text>
              <Text style={[styles.h2, { color: colors.mutedForeground }]}>
                We sent a 6-digit code to {email}. Enter it below to continue.
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
                  value={code}
                  onChangeText={setCode}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  autoComplete="one-time-code"
                  onSubmitEditing={handleVerifyCode}
                  returnKeyType="go"
                />
              </View>

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handleVerifyCode}
                disabled={isLoading || !code}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: isLoading || !code ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.btnInner}>
                    <FontAwesome6 name="circle-notch" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                      Verifying…
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    Verify code
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => { setStep("email"); setCode(""); setError(null); }}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  ← Try a different email
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={[styles.h1, { color: colors.foreground }]}>Reset your password</Text>
              <Text style={[styles.h2, { color: colors.mutedForeground }]}>
                Enter the email address for your account and we'll send you a reset code.
              </Text>

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
                  onSubmitEditing={handleSendCode}
                  returnKeyType="send"
                />
              </View>

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handleSendCode}
                disabled={isLoading || !email}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    opacity: isLoading || !email ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <View style={styles.btnInner}>
                    <FontAwesome6 name="circle-notch" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                      Sending…
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    Send reset code
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.back()}>
                <Text style={[styles.linkText, { color: colors.primary }]}>← Back to sign in</Text>
              </Pressable>
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
  linkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textAlign: "center",
  },
});
