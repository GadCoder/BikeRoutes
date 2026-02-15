## 1. Summary
Add initial Mobile UI flow (themed splash + auth) with a mocked session/router.

## 2. Why
We want an end-to-end mobile shell that feels real (theme, splash, sign-in/register) while backend auth and persistence are still being wired up, so UI development can proceed in parallel.

## 3. What Changed
- Add theme tokens/palette/shadows for consistent styling (`frontend/mobile/src/theme/*`).
- Add Boot Splash screen (`frontend/mobile/src/screens/BootSplashScreen.tsx`).
- Add Sign In / Register screens with shared UI components (`frontend/mobile/src/screens/Auth/*`, `frontend/mobile/src/components/*`).
- Add an `AppRouter` that switches between boot, auth, and authed home (`frontend/mobile/src/router/AppRouter.tsx`).
- Add mocked session helpers (in-memory) for UI-first flows (`frontend/mobile/src/state/session.ts`).
- Wire the router into the app entrypoint (`frontend/mobile/App.tsx`).
- Add Expo config extras for future Google auth wiring (`frontend/mobile/app.json`).

## 4. Considerations
- Auth/session are mocked and stored in-memory only; app restart clears session (`frontend/mobile/src/state/session.ts`).
- Google auth is intentionally disabled until config + SDK wiring is implemented (`frontend/mobile/app.json`).
- No breaking changes.

