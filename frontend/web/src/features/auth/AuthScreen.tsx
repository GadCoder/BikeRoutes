import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import {
  googleSignInSetupMessage,
  isGoogleSignInConfigured,
  requestGoogleIdToken,
} from "./google";

export function AuthScreen() {
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithGoogle, isLoading, error, clearError } = useAuthStore();
  const googleReady = isGoogleSignInConfigured();

  const handleGoogleSignIn = async () => {
    clearError();
    setLocalError(null);

    if (!googleReady) {
      setLocalError(googleSignInSetupMessage());
      return;
    }

    try {
      const idToken = await requestGoogleIdToken();
      await signInWithGoogle(idToken);
    } catch (err: any) {
      setLocalError(err?.message ?? "Google Sign-In failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
      <div
        style={{
          width: "min(460px, calc(100vw - 32px))",
          background: "#ffffff",
          border: "1px solid rgba(15, 23, 42, 0.12)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>BikeRoutes</h1>
        <p style={{ marginTop: 10, marginBottom: 18, color: "#334155" }}>
          Sign in with Google to continue.
        </p>

        {(error || localError) && (
          <div
            style={{
              marginBottom: 14,
              borderRadius: 10,
              padding: "10px 12px",
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              fontSize: 14,
            }}
          >
            {error || localError}
          </div>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #1d4ed8",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {!googleReady && (
          <p style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
            Setup required: `VITE_GOOGLE_CLIENT_ID`.
          </p>
        )}

        <p style={{ marginTop: 16, marginBottom: 0, color: "#64748b", fontSize: 13 }}>
          Password login and registration are no longer available.
        </p>
      </div>
    </div>
  );
}
