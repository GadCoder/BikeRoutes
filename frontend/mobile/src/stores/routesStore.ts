import { create } from "zustand";
import { apiListRoutes, apiGetRoute, apiCreateRoute, apiUpdateRoute, apiDeleteRoute } from "../api/routes";
import { useAuthStore } from "./authStore";
import type { Route, CreateRouteRequest } from "../api/routes";

interface RoutesState {
  routes: Route[];
  currentRoute: Route | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRoutes: () => Promise<void>;
  fetchRoute: (id: string) => Promise<void>;
  createRoute: (data: CreateRouteRequest) => Promise<Route>;
  updateRoute: (id: string, data: Partial<CreateRouteRequest>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useRoutesStore = create<RoutesState>()((set, get) => ({
  routes: [],
  currentRoute: null,
  isLoading: false,
  error: null,

  fetchRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().session?.accessToken;
      if (!token) throw new Error("Not authenticated");
      
      const routes = await apiListRoutes(token);
      set({ routes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch routes", isLoading: false });
    }
  },

  fetchRoute: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().session?.accessToken;
      if (!token) throw new Error("Not authenticated");
      
      const route = await apiGetRoute(token, id);
      set({ currentRoute: route, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch route", isLoading: false });
    }
  },

  createRoute: async (data: CreateRouteRequest) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().session?.accessToken;
      if (!token) throw new Error("Not authenticated");
      
      const route = await apiCreateRoute(token, data);
      set((state) => ({ routes: [route, ...state.routes], isLoading: false }));
      return route;
    } catch (err: any) {
      set({ error: err.message || "Failed to create route", isLoading: false });
      throw err;
    }
  },

  updateRoute: async (id: string, data: Partial<CreateRouteRequest>) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().session?.accessToken;
      if (!token) throw new Error("Not authenticated");
      
      const route = await apiUpdateRoute(token, id, data);
      set((state) => ({
        routes: state.routes.map((r) => (r.id === id ? route : r)),
        currentRoute: state.currentRoute?.id === id ? route : state.currentRoute,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || "Failed to update route", isLoading: false });
    }
  },

  deleteRoute: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().session?.accessToken;
      if (!token) throw new Error("Not authenticated");
      
      await apiDeleteRoute(token, id);
      set((state) => ({
        routes: state.routes.filter((r) => r.id !== id),
        currentRoute: state.currentRoute?.id === id ? null : state.currentRoute,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || "Failed to delete route", isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
