import * as FileSystem from "expo-file-system";
import type { RouteFeature } from "../api/routes";

export type CachedRoute = {
  route: RouteFeature;
  // Client-side timestamps (backend responses don't include created_at/updated_at yet).
  createdAt: string;
  updatedAt: string;
};

type CacheFile = {
  version: 1;
  routes: CachedRoute[];
};

const CACHE_PATH = `${FileSystem.documentDirectory ?? ""}routes-cache-v1.json`;

function nowIso(): string {
  return new Date().toISOString();
}

export async function loadRoutesCache(): Promise<CachedRoute[]> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(CACHE_PATH);
    const parsed = JSON.parse(raw) as CacheFile;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.routes)) return [];
    return parsed.routes;
  } catch {
    return [];
  }
}

export async function saveRoutesCache(routes: CachedRoute[]): Promise<void> {
  const payload: CacheFile = { version: 1, routes };
  await FileSystem.writeAsStringAsync(CACHE_PATH, JSON.stringify(payload));
}

export async function upsertCachedRoute(route: RouteFeature, opts?: { createdAt?: string; updatedAt?: string }) {
  const existing = await loadRoutesCache();
  const next = existing.slice();
  const idx = next.findIndex((r) => r.route.id === route.id);
  const prev = idx >= 0 ? next[idx] : undefined;

  const createdAt = opts?.createdAt ?? prev?.createdAt ?? nowIso();
  const updatedAt = opts?.updatedAt ?? nowIso();
  const entry: CachedRoute = { route, createdAt, updatedAt };

  if (idx >= 0) next[idx] = entry;
  else next.unshift(entry);

  await saveRoutesCache(next);
}

export async function removeCachedRoute(routeId: string) {
  const existing = await loadRoutesCache();
  const next = existing.filter((r) => r.route.id !== routeId);
  await saveRoutesCache(next);
}

