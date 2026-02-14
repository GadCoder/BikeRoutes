import type { ApiError } from "../api/http";
import { login, me, refresh, register, type SessionOut, type UserOut } from "../api/auth";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "../storage/refreshTokenStore";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

let memorySession: Session | null = null;
let refreshInFlight: Promise<Session> | null = null;

function toSession(out: SessionOut): Session {
  return {
    accessToken: out.access_token,
    refreshToken: out.refresh_token,
    user: { id: out.user.id, email: out.user.email },
  };
}

async function persistSession(s: Session): Promise<void> {
  memorySession = s;
  await setRefreshToken(s.refreshToken);
}

async function clearSession(): Promise<void> {
  memorySession = null;
  await clearRefreshToken();
}

export async function loadSession(): Promise<Session | null> {
  const stored = await getRefreshToken();
  if (!stored) return null;

  try {
    const s = toSession(await refresh({ refreshToken: stored }));
    const u = await me({ accessToken: s.accessToken });
    const finalSession: Session = { ...s, user: { id: u.id, email: u.email } };
    await persistSession(finalSession);
    return finalSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function signInWithEmailPassword(args: {
  email: string;
  password: string;
}): Promise<Session> {
  const email = args.email.trim().toLowerCase();
  const out = await login({ email, password: args.password });
  const s = toSession(out);
  await persistSession(s);
  return s;
}

export async function registerWithEmailPassword(args: {
  email: string;
  password: string;
}): Promise<Session> {
  const email = args.email.trim().toLowerCase();
  const out = await register({ email, password: args.password });
  const s = toSession(out);
  await persistSession(s);
  return s;
}

export async function signOut(): Promise<void> {
  await clearSession();
}

function isApi401(err: unknown): boolean {
  const e = err as Partial<ApiError> | undefined;
  return Boolean(e && (e as any).status === 401);
}

async function ensureSessionRefreshed(): Promise<Session> {
  if (memorySession) return memorySession;

  const stored = await getRefreshToken();
  if (!stored) throw new Error("Not authenticated");

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const s = toSession(await refresh({ refreshToken: stored }));
      const u: UserOut = await me({ accessToken: s.accessToken });
      const finalSession: Session = { ...s, user: { id: u.id, email: u.email } };
      await persistSession(finalSession);
      return finalSession;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

// Helper for API calls: if a request fails with 401, refresh once and retry.
export async function withAuthRetry<T>(fn: (accessToken: string) => Promise<T>): Promise<T> {
  const s = memorySession ?? (await ensureSessionRefreshed());
  try {
    return await fn(s.accessToken);
  } catch (err) {
    if (!isApi401(err)) throw err;
    const refreshed = await ensureSessionRefreshed();
    return await fn(refreshed.accessToken);
  }
}

export function isGoogleSignInConfigured(): boolean {
  // Keep hidden unless explicitly configured (Google sign-in not wired yet).
  return Boolean((process.env as any)?.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
}
