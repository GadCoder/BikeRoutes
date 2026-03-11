import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { AppRouter } from "./src/router/AppRouter";
import { configureGoogleSignIn, getGoogleSignInClientIds } from "./src/auth/google";

WebBrowser.maybeCompleteAuthSession();

function googleIdTokenFromResult(result: any): string {
  return String(
    result?.params?.id_token ??
      result?.authentication?.idToken ??
      "",
  ).trim();
}

export default function App() {
  const clientIds = getGoogleSignInClientIds();
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientIds.expoClientId || clientIds.webClientId || undefined,
    webClientId: clientIds.webClientId || undefined,
    iosClientId: clientIds.iosClientId || undefined,
    androidClientId: clientIds.androidClientId || undefined,
  });

  useEffect(() => {
    configureGoogleSignIn(async () => {
      if (!request) {
        throw new Error("Google Sign-In is still initializing. Please try again.");
      }

      const result = await promptAsync();
      if (result.type === "cancel" || result.type === "dismiss") {
        throw new Error("Google Sign-In was canceled.");
      }
      if (result.type !== "success") {
        throw new Error("Google Sign-In failed before token exchange.");
      }

      const idToken = googleIdTokenFromResult(result);
      if (!idToken) {
        throw new Error("Google Sign-In did not return an ID token");
      }
      return { idToken };
    });
  }, [promptAsync, request]);

  return <AppRouter />;
}
