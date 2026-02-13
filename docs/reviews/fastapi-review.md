# FastAPI Backend Review: PR #3 (Routes + Markers)

Note: GitHub API/web access is blocked in this environment, so this review is based on the local branch
`agent/backend-routes` (commit `b188ad9`) compared against `main`.

## MUST FIX (Before Merge)

1. Debug auth header is enabled for any non-production environment.
   - File: `backend/app/auth/dependencies.py`
   - Current behavior: accepts `X-Debug-User-Id` whenever `APP_ENV != "production"`.
   - Risk: if staging is configured as anything other than literal `"production"`, anyone who can hit the API can impersonate any user by setting this header.
   - Fix: restrict this bypass to `APP_ENV == "development"` only, or gate it behind an explicit opt-in setting (for example `ALLOW_DEBUG_AUTH=true`).

## NICE TO HAVE

1. Update semantics: `PUT` endpoints behave like partial updates.
   - File: `backend/app/api/routes.py`
   - `PUT /routes/{route_id}` and `PUT /routes/{route_id}/markers/{marker_id}` accept partial payloads; either switch to `PATCH`, or require full replacement semantics for `PUT`.

2. Allow clearing nullable fields explicitly.
   - Files: `backend/app/api/routes.py`
   - As implemented, `description=None` and `label=None` cannot be explicitly set to null (because `None` is treated as "not provided").
   - Options: use separate "clear" flags, or switch to PATCH + `pydantic` v2 `model_fields_set` checks to distinguish "missing" vs "present null".

3. Avoid redundant ORM loading in `GET /routes/{route_id}`.
   - File: `backend/app/api/routes.py`
   - The query uses `selectinload(Route.markers)` but then markers are fetched again via `_markers_features()`.
   - Either remove the eager load, or reuse `route.markers` and serialize from it.

4. Input validation ergonomics.
   - Files: `backend/app/geo/geojson.py`, `backend/app/api/routes.py`
   - Consider validating coordinate ranges (lat in [-90, 90], lng in [-180, 180]) and `bbox` ranges, returning 400 on out-of-range input.

