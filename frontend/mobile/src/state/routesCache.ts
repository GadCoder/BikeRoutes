import * as FileSystem from "expo-file-system";
import type { Route } from "../api/routes";

export type CachedRoute = {
  route: Route;
  // Local timestamps for cache bookkeeping (separate from backend created_at/updated_at).
  cachedAt: string;
};

type CacheFile = {
  version: 2;
  routes: CachedRoute[];
};

const CACHE_PATH = `${FileSystem.documentDirectory ?? ""}routes-cache-v2.json`;

function nowIso(): string {
  return new Date().toISOString();
}

export async function loadRoutesCache(): Promise<CachedRoute[]> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(CACHE_PATH);
    const parsed = JSON.parse(raw) as CacheFile;
    if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.routes)) return [];
    return parsed.routes;
  } catch {
    return [];
  }
}

export async function saveRoutesCache(routes: CachedRoute[]): Promise<void> {
  const payload: CacheFile = { version: 2, routes };
  await FileSystem.writeAsStringAsync(CACHE_PATH, JSON.stringify(payload));
}

export async function upsertCachedRoute(route: Route) {
  const existing = await loadRoutesCache();
  const next = existing.slice();
  const idx = next.findIndex((r) => r.route.id === route.id);
  const entry: CachedRoute = { route, cachedAt: nowIso() };

  if (idx >= 0) next[idx] = entry;
  else next.unshift(entry);

  await saveRoutesCache(next);
}

export async function removeCachedRoute(routeId: string) {
  const existing = await loadRoutesCache();
  const next = existing.filter((r) => r.route.id !== routeId);
  await saveRoutesCache(next);
}
