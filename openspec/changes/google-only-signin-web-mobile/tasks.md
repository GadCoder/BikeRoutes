## 1. Backend Google Auth Contract

- [x] 1.1 Add backend request/response schema for Google token exchange endpoint returning existing `SessionOut` contract
- [x] 1.2 Implement server-side Google ID token verification (signature, issuer, audience, expiry) with configuration-driven client IDs
- [x] 1.3 Implement `/auth/google` endpoint to resolve or create user by provider identity and issue access/refresh tokens
- [x] 1.4 Extend auth domain model/storage to persist provider metadata (at minimum Google `sub`) used as canonical external identity

## 2. Remove Legacy Credential Auth Paths

- [x] 2.1 Remove backend `/auth/login` interactive password sign-in behavior
- [x] 2.2 Remove backend `/auth/register` interactive password registration behavior
- [x] 2.3 Remove backend password hashing/verification code paths that are no longer used by interactive auth endpoints
- [x] 2.4 Remove or update API client methods in web and mobile that call legacy credential endpoints

## 3. Web Google-Only Sign-In UX

- [x] 3.1 Replace web auth screen forms with a single Google Sign-In action
- [x] 3.2 Integrate web Google sign-in SDK flow to obtain an ID token and exchange it with backend `/auth/google`
- [x] 3.3 Update web auth store/session state to use Google exchange and keep refresh/me behavior unchanged
- [x] 3.4 Remove web login/register components and routing/state branches tied to credential auth

## 4. Mobile Google-Only Sign-In UX

- [x] 4.1 Replace mobile sign-in/register routes with a single Google Sign-In action
- [x] 4.2 Integrate mobile Google sign-in flow (Expo/React Native) to obtain ID token and exchange it with backend `/auth/google`
- [x] 4.3 Update mobile auth store/session state to use Google exchange and preserve refresh/me lifecycle
- [x] 4.4 Remove mobile API/store methods and UI branches tied to email/password auth

## 5. Validation, Hard-Cutover, and Documentation

- [x] 5.1 Add backend tests for valid Google token exchange, invalid token rejection, and no session issuance on failure
- [x] 5.2 Add regression tests confirming legacy credential auth endpoints no longer authenticate users
- [x] 5.3 Add web/mobile tests verifying auth screen only exposes Google Sign-In and no credential inputs
- [x] 5.4 Update environment/config docs for Google OAuth client IDs and backend verification settings for web and mobile
