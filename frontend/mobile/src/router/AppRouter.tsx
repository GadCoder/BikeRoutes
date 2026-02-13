import { useEffect, useState } from "react";
import { BootSplashScreen } from "../screens/BootSplashScreen";
import { RegisterScreen } from "../screens/Auth/RegisterScreen";
import { SignInScreen } from "../screens/Auth/SignInScreen";
import { AuthedHomeScreen } from "../screens/Home/AuthedHomeScreen";
import {
  loadSession,
  registerWithEmailPassword,
  signInWithEmailPassword,
  signOut,
  type Session,
} from "../state/session";

type AuthRoute = "sign_in" | "register";

export function AppRouter() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authRoute, setAuthRoute] = useState<AuthRoute>("sign_in");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const restored = await loadSession();
        if (!mounted) return;
        setSession(restored);
      } finally {
        if (mounted) setBooting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (booting) return <BootSplashScreen />;

  if (!session) {
    if (authRoute === "register") {
      return (
        <RegisterScreen
          onRegister={async (args) => {
            const s = await registerWithEmailPassword(args);
            setSession(s);
          }}
          onBackToSignIn={() => setAuthRoute("sign_in")}
        />
      );
    }

    return (
      <SignInScreen
        onSignIn={async (args) => {
          const s = await signInWithEmailPassword(args);
          setSession(s);
        }}
        onCreateAccount={() => setAuthRoute("register")}
      />
    );
  }

  return (
    <AuthedHomeScreen
      email={session.user.email}
      onSignOut={async () => {
        await signOut();
        setSession(null);
        setAuthRoute("sign_in");
      }}
    />
  );
}

