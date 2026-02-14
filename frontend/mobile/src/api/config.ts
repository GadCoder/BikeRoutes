export function apiBaseUrl(): string {
  // Prefer EXPO_PUBLIC_* env when running locally.
  // Supported keys:
  // - EXPO_PUBLIC_API_URL (preferred)
  // - EXPO_PUBLIC_API_BASE_URL (compat with earlier notes)
  const env =
    ((process.env as any)?.EXPO_PUBLIC_API_URL as string | undefined) ??
    ((process.env as any)?.EXPO_PUBLIC_API_BASE_URL as string | undefined);
  // Default base URL:
  // - production/release: use deployed API
  // - local/dev (Android emulator): http://10.0.2.2:8000
  const fallback = (global as any)?.__DEV__ ? "http://10.0.2.2:8000" : "https://api-bikeroutes.gadcoder.com";
  const base = (env ?? fallback).replace(/\/+$/, "");
  return `${base}/api`;
}
