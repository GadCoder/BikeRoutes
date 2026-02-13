import { apiBaseUrl } from "./config";

export class ApiError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, args: { status: number; bodyText: string }) {
    super(message);
    this.status = args.status;
    this.bodyText = args.bodyText;
  }
}

export async function apiFetch<T>(
  path: string,
  args: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    accessToken?: string;
    json?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const url = new URL(`${apiBaseUrl()}${path}`);
  for (const [k, v] of Object.entries(args.query ?? {})) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (args.json !== undefined) headers["Content-Type"] = "application/json";
  if (args.accessToken) headers.Authorization = `Bearer ${args.accessToken}`;

  const res = await fetch(url.toString(), {
    method: args.method ?? "GET",
    headers,
    body: args.json === undefined ? undefined : JSON.stringify(args.json),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new ApiError(`HTTP ${res.status} ${res.statusText}`, { status: res.status, bodyText });
  }

  // Some endpoints return 204.
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

