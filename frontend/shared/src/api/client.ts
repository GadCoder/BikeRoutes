import { ApiError } from "../types";

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      json?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    
    for (const [k, v] of Object.entries(options.query ?? {})) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const token = this.config.getToken?.();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers,
      body: options.json === undefined ? undefined : JSON.stringify(options.json),
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.config.onUnauthorized?.();
      }
      const bodyText = await res.text().catch(() => "");
      throw new ApiError(`HTTP ${res.status} ${res.statusText}`, { status: res.status, bodyText });
    }

    if (res.status === 204) return undefined as T;

    return (await res.json()) as T;
  }
}
