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

export async function apiGoogleExchange(idToken: string): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/google", {
    method: "POST",
    json: { id_token: idToken },
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

// Convenience wrappers used by `src/state/session.ts` (object-arg style).
export function googleExchange(args: { idToken: string }): Promise<SessionOut> {
  return apiGoogleExchange(args.idToken);
}

export function refresh(args: { refreshToken: string }): Promise<SessionOut> {
  return apiRefresh(args.refreshToken);
}

export function me(args: { accessToken: string }): Promise<UserOut> {
  return apiMe(args.accessToken);
}
