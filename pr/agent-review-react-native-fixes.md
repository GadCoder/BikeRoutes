## 1. Summary
Remove a dead "Forgot Password?" tap target from the mobile sign-in screen.

## 2. Why
The link was rendered as interactive but had a no-op handler, which makes the UI feel broken and hurts trust during first-run flows.

## 3. What Changed
- Removed the no-op helper link from `frontend/mobile/src/screens/Auth/SignInScreen.tsx`.
- Tightened `TextField` typing so `helperRight` always requires an `onPress` handler (`frontend/mobile/src/components/TextField.tsx`).

## 4. Considerations
- This intentionally does not add a forgot-password flow yet; it only removes the misleading control until a real handler exists.
