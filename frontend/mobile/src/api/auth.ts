import { apiBaseUrl } from "./config";
import { apiFetch } from "./http";

export interface SessionOut {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserOut;
}

export interface UserOut {
  id: string;
  email: string;
}

export async function apiLogin(email: string, password: string): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/login", {
    method: "POST",
    json: { email, password },
  });
}

export async function apiRegister(email: string, password: string): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/register", {
    method: "POST",
    json: { email, password },
  });
}

export async function apiRefresh(refreshToken: string): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/refresh", {
    method: "POST",
    json: { refresh_token: refreshToken },
  });
}

export async function apiMe(accessToken: string): Promise<UserOut> {
  return apiFetch<UserOut>("/auth/me", { accessToken });
}
