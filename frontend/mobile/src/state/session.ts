export type Session = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

let memorySession: Session | null = null;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function loadSession(): Promise<Session | null> {
  // Mocked persistence for UI-first PRs. Replace with AsyncStorage/SecureStore in the API wiring pass.
  await sleep(350);
  return memorySession;
}

export async function signInWithEmailPassword(args: {
  email: string;
  password: string;
}): Promise<Session> {
  // Mock sign-in until backend `/api/auth/login` is available.
  await sleep(450);
  const email = args.email.trim().toLowerCase();

  memorySession = {
    accessToken: "mock-access",
    refreshToken: "mock-refresh",
    user: { id: "user_mock_1", email },
  };

  return memorySession;
}

export async function registerWithEmailPassword(args: {
  email: string;
  password: string;
}): Promise<Session> {
  // Mock register until backend `/api/auth/register` is available.
  await sleep(500);
  const email = args.email.trim().toLowerCase();

  memorySession = {
    accessToken: "mock-access",
    refreshToken: "mock-refresh",
    user: { id: "user_mock_1", email },
  };

  return memorySession;
}

export async function signOut(): Promise<void> {
  await sleep(120);
  memorySession = null;
}

export function isGoogleSignInConfigured(): boolean {
  // MVP: hide Google if not configured (and avoid showing dead controls).
  // Wire this to real Expo config + auth SDK in the API integration pass.
  return false;
}
