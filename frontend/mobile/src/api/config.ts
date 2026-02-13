export function apiBaseUrl(): string {
  // Prefer EXPO_PUBLIC_* env when running locally.
  // Supported keys:
  // - EXPO_PUBLIC_API_URL (preferred)
  // - EXPO_PUBLIC_API_BASE_URL (compat with earlier notes)
  const env =
    ((process.env as any)?.EXPO_PUBLIC_API_URL as string | undefined) ??
    ((process.env as any)?.EXPO_PUBLIC_API_BASE_URL as string | undefined);

  // Android emulator -> host machine: http://10.0.2.2:8000
  const base = (env ?? "http://10.0.2.2:8000").replace(/\/+$/, "");
  return `${base}/api`;
}
