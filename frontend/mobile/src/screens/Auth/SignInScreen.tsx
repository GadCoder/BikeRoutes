import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppIcon } from "../../components/AppIcon";
import { Button } from "../../components/Button";
import { WaveBackground } from "../../components/WaveBackground";
import { tokens } from "../../theme/tokens";
import { getGoogleSignInSetupMessage, isGoogleSignInConfigured } from "../../state/session";

export function SignInScreen(props: {
  onGoogleSignIn: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showGoogle = isGoogleSignInConfigured();

  async function submitGoogle() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await props.onGoogleSignIn();
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <WaveBackground />
      <View style={styles.root}>
        <View style={styles.top}>
          <AppIcon size={80} />
          <Text style={styles.h1}>Sign In</Text>
          <Text style={styles.sub}>Continue with your Google account.</Text>
        </View>

        <View style={styles.form}>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button
            variant="secondary"
            label={submitting ? "Signing In..." : "Continue with Google"}
            onPress={submitGoogle}
            disabled={submitting || !showGoogle}
          />
          {!showGoogle && (
            <Text style={styles.setup}>{getGoogleSignInSetupMessage()}</Text>
          )}
          <Text style={styles.footerText}>
            Email/password sign-in and registration are no longer available.
          </Text>
        </View>
      </View>
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
    gap: tokens.space.md,
  },
  error: {
    fontSize: tokens.font.size.sm,
    color: "#b42318",
    backgroundColor: "#fee4e2",
    borderWidth: 1,
    borderColor: "#fda29b",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radius.md,
  },
  setup: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
    opacity: 0.9,
  },
  footerText: {
    marginTop: tokens.space.sm,
    fontSize: tokens.font.size.sm,
    color: tokens.color.textSecondary,
  },
});
