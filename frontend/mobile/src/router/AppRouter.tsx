import { useEffect, useState } from "react";
import { BootSplashScreen } from "../screens/BootSplashScreen";
import { AuthedHomeScreen } from "../screens/Home/AuthedHomeScreen";
import { RegisterScreen } from "../screens/Auth/RegisterScreen";
import { SignInScreen } from "../screens/Auth/SignInScreen";
import { EditorScreen } from "../screens/Editor/EditorScreen";
import { MyRoutesScreen } from "../screens/Routes/MyRoutesScreen";
import { RouteDetailsScreen } from "../screens/Routes/RouteDetailsScreen";
import { BottomNav, BOTTOM_NAV_HEIGHT, type BottomTab } from "../components/BottomNav";
import { Alert, View } from "react-native";
import {
  loadSession,
  onSessionChange,
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

  const [tab, setTab] = useState<BottomTab>("routes");
  const [routesScreen, setRoutesScreen] = useState<"list" | "details">("list");
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [editorRouteId, setEditorRouteId] = useState<string | null>(null);

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

  // Keep React state in sync when withAuthRetry refreshes the token in the background.
  useEffect(() => {
    return onSessionChange((updated) => setSession(updated));
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
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "routes" ? (
          routesScreen === "details" && activeRouteId ? (
            <RouteDetailsScreen
              accessToken={session.accessToken}
              routeId={activeRouteId}
              bottomInset={BOTTOM_NAV_HEIGHT}
              onBack={() => {
                setRoutesScreen("list");
                setActiveRouteId(null);
              }}
              onEditRoute={(rid) => {
                setEditorRouteId(rid);
                setTab("editor");
              }}
            />
          ) : (
            <MyRoutesScreen
              accessToken={session.accessToken}
              bottomInset={BOTTOM_NAV_HEIGHT}
              isActive={tab === "routes"}
              onCreate={() => {
                setEditorRouteId(null);
                setTab("editor");
              }}
              onOpenRoute={(rid) => {
                setActiveRouteId(rid);
                setRoutesScreen("details");
              }}
            />
          )
        ) : tab === "editor" ? (
          <EditorScreen
            accessToken={session.accessToken}
            bottomInset={BOTTOM_NAV_HEIGHT}
            routeId={editorRouteId}
            onExitEditor={() => {
              setTab("routes");
              setRoutesScreen("list");
              setActiveRouteId(null);
              setEditorRouteId(null);
            }}
            onSaved={(rid) => {
              setTab("routes");
              setRoutesScreen("details");
              setActiveRouteId(rid);
              setEditorRouteId(null);
            }}
          />
        ) : (
          <AuthedHomeScreen
            email={session.user.email}
            onSignOut={async () => {
              await signOut();
              setSession(null);
              setAuthRoute("sign_in");
            }}
          />
        )}
      </View>

      <BottomNav
        active={tab}
        onSelect={(t) => {
          const apply = () => {
            setTab(t);
            if (t === "routes") {
              setRoutesScreen("list");
              setActiveRouteId(null);
            }
            if (t === "editor") {
              // Keep current editorRouteId (new vs edit) as-is.
            }
          };

          if (tab === "editor" && t !== "editor") {
            Alert.alert("Leave editor?", "Unsaved changes may be lost.", [
              { text: "Cancel", style: "cancel" },
              { text: "Leave", style: "destructive", onPress: apply },
            ]);
            return;
          }

          apply();
        }}
      />
    </View>
  );
}
