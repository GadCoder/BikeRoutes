type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (callback?: (notification: unknown) => void) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function googleClientId(): string {
  return String((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? "").trim();
}

export function isGoogleSignInConfigured(): boolean {
  return googleClientId().length > 0;
}

export function googleSignInSetupMessage(): string {
  return "Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID.";
}

async function loadGoogleIdentityScript(): Promise<void> {
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(
        "script[data-bikeroutes-google-identity='1']",
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In SDK")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.bikeroutesGoogleIdentity = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Sign-In SDK"));
      document.head.appendChild(script);
    });
  }

  await scriptLoadPromise;
}

export async function requestGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInConfigured()) {
    throw new Error(googleSignInSetupMessage());
  }

  await loadGoogleIdentityScript();
  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error("Google Sign-In SDK did not initialize");
  }

  return await new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Google Sign-In timed out. Please try again."));
    }, 15000);

    googleId.initialize({
      client_id: googleClientId(),
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        window.clearTimeout(timeout);
        const token = response.credential;
        if (!token) {
          reject(new Error("Google Sign-In did not return an ID token"));
          return;
        }
        resolve(token);
      },
    });

    googleId.prompt();
  });
}
