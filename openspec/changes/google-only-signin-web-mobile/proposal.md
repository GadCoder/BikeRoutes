## Why

The current login flow supports non-Google paths, which increases UX complexity and maintenance overhead across clients. Standardizing on Google Sign-In now simplifies authentication, reduces auth-surface area, and aligns mobile and web behavior.

## What Changes

- Replace existing login methods with Google Sign-In as the only supported interactive authentication flow on web and mobile.
- Update auth UI on both clients to present only the Google sign-in action and remove alternative credential/login options.
- Update backend auth handling to accept and validate Google identity tokens for sign-in/session creation as the primary path.
- **BREAKING**: Existing non-Google login paths are removed and no longer available to end users.

## Capabilities

### New Capabilities
- `google-only-authentication`: End-to-end Google-only sign-in behavior across web, mobile, and backend token/session handling.

### Modified Capabilities
- _None (no existing spec capabilities present yet in `openspec/specs`)._

## Impact

- Affected systems: web auth UI/flow, mobile auth UI/flow, backend authentication endpoints/session issuance.
- Dependencies: Google OAuth/OpenID configuration for web and mobile clients, backend Google token verification integration.
- APIs/contracts: login contract changes to remove non-Google auth paths and enforce Google-token-based sign-in.
