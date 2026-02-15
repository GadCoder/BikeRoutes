# Refactor Follow-Ups (Missing / Not Yet Verified)

This repo builds/typechecks again (mobile + web), but the refactor left a few gaps that are not fully verified end-to-end yet.

## Frontend: Mobile

- [ ] Runtime smoke test: `npm run dev:mobile` (Expo) and basic flows (register, login, list routes, create/edit route, add markers).
- [ ] Confirm API base URL / networking works on device/simulator (CORS is web-only; mobile needs reachable `DATABASE_URL` backend host).

## Frontend: Web

- [ ] Runtime smoke test: `npm run dev:web` and basic flows (auth, list, detail, editor).
- [ ] Confirm map/editor interactions behave as expected (vertex drag, clicks add points, cleanup on unmount).

## Backend

- [ ] **Tests require PostGIS**: `backend/tests/conftest.py` defaults `TEST_DATABASE_URL` to a local Postgres/PostGIS database `bikeroutes_test`.
  - Missing: a guaranteed way to provision `bikeroutes_test` (docker-compose currently provisions only `${POSTGRES_DB:-bikeroutes}`).
- [ ] **Auth tests are coupled to global SQLAlchemy metadata**:
  - `backend/tests/test_auth.py` uses SQLite in-memory, but the global `Base` gets polluted when other tests import `app.main` / `app.api.routes`, which registers GeoAlchemy2 `Geometry` columns.
  - Result: SQLite tries to call SpatiaLite functions like `RecoverGeometryColumn`, which are not present by default.
  - Missing: test isolation strategy (examples):
    - Split declarative bases (auth-only Base vs geo Base), or
    - Restructure `backend/tests/conftest.py` so importing `app.main` (and thus routes/geo models) is lazy and doesn’t happen for auth-only tests, or
    - Run auth tests against Postgres/PostGIS too (drop SQLite usage).
- [ ] Verify public/private access rules with real HTTP calls:
  - Public route readable without auth.
  - Private route should return `401` when unauthenticated and `404` for non-owner authenticated users.

## Hygiene

- [ ] Remove the stray test artifact file: `backend/file::memory:` (untracked).
- [ ] Address `npm audit` output (currently reports high severity vulnerabilities after install).

