import { apiFetch } from "./http";

export type UserOut = { id: string; email: string };

export type SessionOut = {
  access_token: string;
  refresh_token: string;
  user: UserOut;
};

export async function register(args: { email: string; password: string }): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/register", {
    method: "POST",
    json: { email: args.email, password: args.password },
  });
}

export async function login(args: { email: string; password: string }): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/login", {
    method: "POST",
    json: { email: args.email, password: args.password },
  });
}

export async function refresh(args: { refreshToken: string }): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/refresh", {
    method: "POST",
    json: { refresh_token: args.refreshToken },
  });
}

export async function me(args: { accessToken: string }): Promise<UserOut> {
  return apiFetch<UserOut>("/auth/me", {
    method: "GET",
    accessToken: args.accessToken,
  });
}
