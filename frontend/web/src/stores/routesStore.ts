import { create } from "zustand";
import { api } from "../api/client";
import type { Route } from "../api/types";

interface RoutesState {
  routes: Route[];
  currentRoute: Route | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRoutes: () => Promise<void>;
  fetchRoute: (id: string) => Promise<void>;
  createRoute: (data: any) => Promise<Route>;
  updateRoute: (id: string, data: any) => Promise<void>;
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
      const routes = await api.listRoutes();
      set({ routes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch routes", isLoading: false });
    }
  },

  fetchRoute: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const route = await api.getRoute(id);
      set({ currentRoute: route, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch route", isLoading: false });
    }
  },

  createRoute: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const route = await api.createRoute(data);
      set((state) => ({ 
        routes: [route, ...state.routes],
        isLoading: false 
      }));
      return route;
    } catch (err: any) {
      set({ error: err.message || "Failed to create route", isLoading: false });
      throw err;
    }
  },

  updateRoute: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const route = await api.updateRoute(id, data);
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
      await api.deleteRoute(id);
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
