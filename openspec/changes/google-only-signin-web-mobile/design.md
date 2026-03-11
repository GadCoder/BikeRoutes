## Context

The current system uses first-party email/password authentication with `/auth/register`, `/auth/login`, `/auth/refresh`, and `/auth/me` in the backend, and corresponding login/register flows in both web and mobile clients.

This change is cross-cutting: backend token issuance, web auth UI/state, and mobile auth UI/state must all shift to a single Google-based identity path. The proposal marks this as a breaking change because non-Google interactive login is removed.

Key constraints:
- Preserve existing access/refresh token session model used by protected APIs.
- Keep user-facing sign-in behavior aligned across web and mobile.
- Use provider-backed identity verification (Google ID token) on the backend before session creation.
- Ensure transition is safe for currently logged-in users during rollout.

## Goals / Non-Goals

**Goals:**
- Support Google Sign-In as the only interactive login method for web and mobile.
- Verify Google identity tokens server-side and mint existing app session tokens (access/refresh).
- Remove login/register UI and client calls that use email/password credentials.
- Keep downstream authenticated API usage unchanged (Bearer access token + refresh flow).

**Non-Goals:**
- Replacing app session JWT format or refresh-token rotation strategy.
- Supporting non-Google social providers in this change.
- Building account-linking across multiple identity providers.
- Bulk data migration of historical user records beyond fields needed for Google identity mapping.

## Decisions

1. Backend introduces Google token exchange endpoint and deprecates credential login/register
- Decision: Add a new endpoint (for example `/auth/google`) that accepts a Google ID token, verifies it with Google public keys/issuer/audience checks, upserts user identity, then returns the existing `SessionOut` shape.
- Rationale: Preserves session contract for all existing authenticated API consumers while changing only initial sign-in mechanism.
- Alternatives considered:
  - Trust ID tokens only on client and skip server verification: rejected due to security risk.
  - Replace app JWTs entirely with Google tokens: rejected because backend auth deps and route guards rely on app-issued tokens.

2. Canonical user identity is keyed by Google subject (`sub`) with email as profile data
- Decision: Persist provider identity (Google `sub`) as the stable external ID, treating email as mutable profile attribute.
- Rationale: Email can change; `sub` is stable and prevents accidental account duplication.
- Alternatives considered:
  - Key users by email only: rejected due to edge cases when email changes or is unverified.

3. Web and mobile keep thin provider-specific login clients, unified backend exchange
- Decision: Each client obtains Google ID token with platform-appropriate SDK and exchanges it with backend using one shared API contract.
- Rationale: Platform SDK differences remain local while backend behavior stays consistent.
- Alternatives considered:
  - Perform different backend endpoints per platform: rejected as unnecessary contract divergence.

4. Remove credential-based UI and API methods immediately (no coexistence window)
- Decision: Delete/disable register and password login paths in client UX and backend public API as part of this change, with no dual-path period.
- Rationale: Requirement is Google-only auth; keeping both paths increases support/security surface.
- Alternatives considered:
  - Keep email/password as hidden fallback: rejected because it contradicts product requirement and complicates testing.

5. Maintain current refresh endpoint and token lifecycle
- Decision: Keep `/auth/refresh` and `/auth/me` semantics unchanged.
- Rationale: Reduces blast radius and avoids reworking route authorization.
- Alternatives considered:
  - Re-auth with Google on every expiry: rejected due to poorer UX and unnecessary provider dependency for routine refresh.

## Risks / Trade-offs

- [Google service or SDK outage impacts sign-in availability] -> Mitigation: retain active sessions via refresh tokens; communicate degraded sign-in status and retry UX.
- [Incorrect token verification config (issuer/audience/client ID)] -> Mitigation: strict startup validation of env vars and integration tests with invalid-token cases.
- [User duplication when existing credential users first sign in with Google] -> Mitigation: deterministic account-link policy (match verified email once, then persist provider `sub` mapping) with audit logging.
- [Breaking API consumers expecting `/auth/login` or `/auth/register`] -> Mitigation: immediate contract update, clear release notes, and contract tests for new `/auth/google` flow.
- [Mobile/web config drift for OAuth client IDs] -> Mitigation: centralized env/config docs and preflight checks in app startup/build.

## Migration Plan

1. Add backend Google token verifier and `/auth/google` exchange endpoint.
2. Extend user model/storage for provider identity fields and apply DB migration.
3. Implement web Google Sign-In button + token exchange; remove login/register forms from primary auth screen.
4. Implement mobile Google Sign-In flow + token exchange; remove credential auth screens/actions.
5. Add/adjust tests: backend token verification and session issuance; web/mobile auth state transitions for Google-only path.
6. Remove `/auth/login` and `/auth/register` endpoints and all credential-based client entry points in the same change set.
7. Rollback strategy: if critical issues occur, revert the release commit set; no runtime fallback path is maintained.

## Open Questions

- Should existing credential-only accounts be auto-linked by verified email on first Google sign-in, or require explicit migration confirmation?
- Which Google SDK/library will be standardized for web and for React Native in this repo?
- Do we require domain restrictions (e.g., allowlist) for Google accounts, or any account with verified Google identity?
