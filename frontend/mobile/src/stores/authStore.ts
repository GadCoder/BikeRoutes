import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { apiGoogleExchange, apiMe } from "../api/auth";
import { requestGoogleIdToken } from "../auth/google";
import type { SessionOut } from "../api/auth";

interface User {
  id: string;
  email: string;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const SESSION_KEY = "session";

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const stored = await SecureStore.getItemAsync(SESSION_KEY);
      if (stored) {
        const parsed: Session = JSON.parse(stored);
        // Validate token by fetching user
        await apiMe(parsed.accessToken);
        set({ session: parsed, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      // Invalid or expired session
      await SecureStore.deleteItemAsync(SESSION_KEY);
      set({ session: null, isInitialized: true });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const idToken = await requestGoogleIdToken();
      const response = await apiGoogleExchange(idToken);
      const session = toSession(response);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      set({ session, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Google sign-in failed", isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    set({ session: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

function toSession(out: SessionOut): Session {
  return {
    accessToken: out.access_token,
    refreshToken: out.refresh_token,
    user: { id: out.user.id, email: out.user.email },
  };
}
