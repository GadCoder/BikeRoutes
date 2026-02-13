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
import { TextField } from "../../components/TextField";
import { WaveBackground } from "../../components/WaveBackground";
import { tokens } from "../../theme/tokens";

export function RegisterScreen(props: {
  onRegister: (args: { email: string; password: string }) => Promise<void>;
  onBackToSignIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 2 && password.length >= 6, [email, password]);

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await props.onRegister({ email, password });
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
          <Text style={styles.h1}>Create Account</Text>
          <Text style={styles.sub}>Join BikeRoutes and start drawing your next ride.</Text>
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
            placeholder="At least 6 characters"
            secureTextEntry
            textContentType="newPassword"
          />

          <View style={styles.cta}>
            <Button
              label={submitting ? "Creating..." : "Create Account"}
              onPress={submit}
              disabled={!canSubmit || submitting}
              rightIcon={<Text style={styles.arrow}>{"\u2192"}</Text>}
            />
          </View>

          <View style={styles.backRow}>
            <Button
              variant="ghost"
              label="Back to Sign In"
              onPress={props.onBackToSignIn}
            />
          </View>
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
  backRow: {
    marginTop: 12,
  },
});

