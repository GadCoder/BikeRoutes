# Sharing Minimum (Agent E) - Implementation Notes

Applies to OpenSpec MVP Track E tasks `5.1–5.2` (`openspec/changes/bootstrap-bike-routes-mvp/tasks.md`).

Prereqs (not in this worktree yet):
- Routes CRUD exists (Track C, esp. `3.2`).
- Auth identity dependency exists (Track B, esp. `2.3`) to identify the current user for owner-only mutations.

## DB / Migration

Add to `routes` table:
- `is_public BOOLEAN NOT NULL DEFAULT false`
- `share_token TEXT NULL` (or `UUID NULL`)

Constraints / indexes:
- Unique constraint on `share_token` (prefer a partial unique index for nullable column in Postgres).
- Optional index on `is_public` if discovery/listing queries filter on it heavily.

Data rules:
- Existing routes default to private (`is_public=false`) with `share_token=NULL`.

## Endpoints

### Toggle public/private (owner-only)

Minimal approach: extend the existing route update endpoint (once it exists) to accept `is_public`.
- Example: `PATCH /api/routes/{route_id}` with body `{ "is_public": true | false }`

Behavior:
- Auth required.
- Only the route owner may change `is_public`.
- When setting `is_public=true`:
  - If `share_token` is NULL, generate a new token and persist it.
- When setting `is_public=false`:
  - Prefer MVP behavior: revoke sharing by clearing `share_token` (forces a new token next time it becomes public).
  - If the team prefers stable tokens across toggles, keep `share_token` but ensure the share endpoint enforces `is_public`.

Response:
- Include `is_public` and `share_token` (if present) in the route payload so clients can render "Share" UI.

### Share token lookup (unauthenticated)

`GET /api/routes/share/{token}`

Behavior:
- No auth required.
- Lookup the route by `share_token`.
- If token not found, return `404`.
- If token found but route is not publicly shareable, return `404` (avoid leaking that a token exists).
  - Recommended MVP rule: require `routes.is_public = true` for this endpoint to return the route.

Response:
- Return the same route payload shape as the normal route-read endpoint (Track C), so clients can reuse parsing/rendering.

## Permission Rules Summary

- Only owners can:
  - Toggle `routes.is_public`.
  - Generate/regenerate/revoke `routes.share_token` (whether explicit or implicit via visibility toggle).
- Anyone can:
  - Read a route via `/api/routes/share/{token}` only if it is publicly shareable under the chosen rule (recommended: `is_public=true`).

