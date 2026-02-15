import { ApiError } from "./types";

export class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      json?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    
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

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers,
      body: options.json === undefined ? undefined : JSON.stringify(options.json),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new ApiError(`HTTP ${res.status} ${res.statusText}`, { status: res.status, bodyText });
    }

    if (res.status === 204) return undefined as T;

    return (await res.json()) as T;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; user: { id: string; email: string } }>("/auth/login", { method: "POST", json: { email, password } });
  }

  async register(email: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; user: { id: string; email: string } }>("/auth/register", { method: "POST", json: { email, password } });
  }

  // Routes
  async listRoutes() {
    return this.request<any[]>("/routes");
  }

  async getRoute(id: string) {
    return this.request<any>(`/routes/${id}`);
  }

  async createRoute(data: any) {
    return this.request<any>("/routes", { method: "POST", json: data });
  }

  async updateRoute(id: string, data: any) {
    return this.request<any>(`/routes/${id}`, { method: "PUT", json: data });
  }

  async deleteRoute(id: string) {
    return this.request<void>(`/routes/${id}`, { method: "DELETE" });
  }
}

export const api = new ApiClient();
