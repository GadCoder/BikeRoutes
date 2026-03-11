import Constants from "expo-constants";

type GoogleSignInResult = {
  idToken: string;
};

export type GoogleSignInHandler = () => Promise<GoogleSignInResult>;

let googleSignInHandler: GoogleSignInHandler | null = null;

type GoogleClientIds = {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
  expoClientId: string;
};

function readExtra(name: string): string {
  return String((Constants.expoConfig?.extra as any)?.[name] ?? "").trim();
}

function configuredClientIds(): GoogleClientIds {
  const sharedClientId = String((process.env as any)?.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();
  return {
    webClientId:
      String((process.env as any)?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "").trim() ||
      sharedClientId ||
      readExtra("googleWebClientId") ||
      readExtra("googleOauthClientId"),
    iosClientId:
      String((process.env as any)?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "").trim() ||
      readExtra("googleIosClientId"),
    androidClientId:
      String((process.env as any)?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "").trim() ||
      readExtra("googleAndroidClientId"),
    expoClientId:
      String((process.env as any)?.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? "").trim() ||
      readExtra("googleExpoClientId"),
  };
}

export function getGoogleSignInClientIds(): GoogleClientIds {
  return configuredClientIds();
}

export function isGoogleSignInConfigured(): boolean {
  const ids = configuredClientIds();
  return (
    ids.webClientId.length > 0 ||
    ids.iosClientId.length > 0 ||
    ids.androidClientId.length > 0 ||
    ids.expoClientId.length > 0
  );
}

export function googleSignInSetupMessage(): string {
  return "Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and platform IDs (EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) or app.json extras.";
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
