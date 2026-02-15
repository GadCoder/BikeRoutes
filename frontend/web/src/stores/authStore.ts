import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/client";
import type { Session, User } from "../api/types";

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const session = await api.login(email, password);
          api.setAccessToken(session.access_token);
          set({ session, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || "Login failed", isLoading: false });
          throw err;
        }
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const session = await api.register(email, password);
          api.setAccessToken(session.access_token);
          set({ session, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || "Registration failed", isLoading: false });
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
      },
    }
  )
);
