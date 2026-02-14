import type { SessionOut } from "./api";

const ACCESS_TOKEN_KEY = "bikeroutes.web.access_token";

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSession(s: SessionOut): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, s.access_token);
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore
  }
}
