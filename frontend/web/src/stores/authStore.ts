import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/client";
import { ApiError } from "../api/client";
import type { Session } from "../api/types";

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        if (get().isInitialized) return;
        const existing = get().session;
        if (!existing) {
          set({ isInitialized: true });
          return;
        }

        set({ isLoading: true, error: null });
        api.setAccessToken(existing.access_token);
        try {
          const user = await api.me();
          set({
            session: {
              ...existing,
              user,
            },
            isInitialized: true,
            isLoading: false,
          });
          return;
        } catch (err) {
          const apiErr = err as Partial<ApiError>;
          if (apiErr?.status !== 401) {
            set({
              error: (err as any)?.message || "Failed to restore session",
              isInitialized: true,
              isLoading: false,
            });
            return;
          }
        }

        try {
          const refreshed = await api.refresh(existing.refresh_token);
          api.setAccessToken(refreshed.access_token);
          const user = await api.me();
          set({
            session: {
              ...refreshed,
              user,
            },
            isInitialized: true,
            isLoading: false,
            error: null,
          });
        } catch {
          api.setAccessToken(null);
          set({ session: null, isInitialized: true, isLoading: false, error: null });
        }
      },

      signInWithGoogle: async (idToken: string) => {
        set({ isLoading: true, error: null });
        try {
          const session = await api.googleExchange(idToken);
          api.setAccessToken(session.access_token);
          const user = await api.me();
          const normalizedSession: Session = { ...session, user };
          set({ session: normalizedSession, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || "Google sign-in failed", isLoading: false });
          throw err;
        }
      },

      logout: () => {
        api.setAccessToken(null);
        set({ session: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        if (state?.session?.access_token) {
          api.setAccessToken(state.session.access_token);
        }
        if (state) {
          state.isInitialized = false;
        }
      },
    }
  )
);
