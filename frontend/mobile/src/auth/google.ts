import Constants from "expo-constants";

type GoogleSignInResult = {
  idToken: string;
};

export type GoogleSignInHandler = () => Promise<GoogleSignInResult>;

let googleSignInHandler: GoogleSignInHandler | null = null;

function configuredClientId(): string {
  const envClientId = String((process.env as any)?.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();
  if (envClientId) return envClientId;
  return String((Constants.expoConfig?.extra as any)?.googleOauthClientId ?? "").trim();
}

export function isGoogleSignInConfigured(): boolean {
  return configuredClientId().length > 0;
}

export function googleSignInSetupMessage(): string {
  return "Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID (or app.json extra.googleOauthClientId).";
}

export function configureGoogleSignIn(handler: GoogleSignInHandler): void {
  googleSignInHandler = handler;
}

export async function requestGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInConfigured()) {
    throw new Error(googleSignInSetupMessage());
  }
  if (!googleSignInHandler) {
    throw new Error("Google Sign-In SDK integration is not wired yet for mobile.");
  }

  const result = await googleSignInHandler();
  const idToken = result?.idToken?.trim();
  if (!idToken) {
    throw new Error("Google Sign-In did not return an ID token");
  }
  return idToken;
}
