import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppIcon } from "../../components/AppIcon";
import { Button } from "../../components/Button";
import { DividerLabel } from "../../components/Divider";
import { TextField } from "../../components/TextField";
import { WaveBackground } from "../../components/WaveBackground";
import { tokens } from "../../theme/tokens";
import { isGoogleSignInConfigured } from "../../state/session";

export function SignInScreen(props: {
  onSignIn: (args: { email: string; password: string }) => Promise<void>;
  onCreateAccount: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 2 && password.length > 0, [email, password]);
  const showGoogle = isGoogleSignInConfigured();

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await props.onSignIn({ email, password });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <WaveBackground />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.top}>
          <AppIcon size={80} />
          <Text style={styles.h1}>Sign In</Text>
          <Text style={styles.sub}>Welcome back! Ready for your next ride?</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="rider@example.com"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            textContentType="password"
          />

          <View style={styles.cta}>
            <Button
              label={submitting ? "Signing In..." : "Sign In"}
              onPress={submit}
              disabled={!canSubmit || submitting}
              rightIcon={<Text style={styles.arrow}>{"\u2192"}</Text>}
            />
          </View>

          {showGoogle ? (
            <>
              <DividerLabel label="OR CONNECT WITH" />
              <View style={styles.socialRow}>
                <Button
                  variant="secondary"
                  label="Continue with Google"
                  onPress={() => {}}
                />
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text accessibilityRole="link" onPress={props.onCreateAccount} style={styles.footerLink}>
              Create Account
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  root: {
    flex: 1,
    paddingHorizontal: tokens.space.xl,
  },
  top: {
    alignItems: "center",
    paddingTop: tokens.space.xl,
  },
  h1: {
    marginTop: tokens.space.lg,
    fontSize: tokens.font.size.xl,
    fontWeight: tokens.font.weight.bold,
    color: tokens.color.text,
  },
  sub: {
    marginTop: 8,
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
    opacity: 0.9,
    textAlign: "center",
  },
  form: {
    marginTop: tokens.space.xl,
  },
  cta: {
    marginTop: tokens.space.lg,
  },
  arrow: {
    color: tokens.color.onPrimary,
    fontSize: 18,
    fontWeight: tokens.font.weight.bold,
  },
  socialRow: {
    marginTop: tokens.space.md,
  },
  footer: {
    marginTop: "auto",
    paddingTop: tokens.space.xl,
    paddingBottom: tokens.space.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
  },
  footerLink: {
    color: tokens.color.primary,
    fontWeight: tokens.font.weight.bold,
  },
});
