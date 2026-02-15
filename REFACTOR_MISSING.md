# Refactor Follow-Ups (Missing / Not Yet Verified)

This repo builds/typechecks again (mobile + web), but the refactor left a few gaps that are not fully verified end-to-end yet.

## Frontend: Mobile

- [ ] Runtime smoke test: `npm run dev:mobile` (Expo) and basic flows (register, login, list routes, create/edit route, add markers).
- [ ] Confirm API base URL / networking works on device/simulator (CORS is web-only; mobile needs reachable `DATABASE_URL` backend host).

## Frontend: Web

- [ ] Runtime smoke test: `npm run dev:web` and basic flows (auth, list, detail, editor).
- [ ] Confirm map/editor interactions behave as expected (vertex drag, clicks add points, cleanup on unmount).

## Backend

- [x] **Tests require PostGIS**: `backend/tests/conftest.py` defaults `TEST_DATABASE_URL` to a local Postgres/PostGIS database `bikeroutes_test`.
  - ✅ **FIXED**: Added `backend/scripts/init-test-db.sh` that creates `bikeroutes_test` with PostGIS on container init.
  - ✅ **FIXED**: Updated `docker-compose.yml` to mount init script.
- [x] **Auth tests are coupled to global SQLAlchemy metadata**:
  - `backend/tests/test_auth.py` used SQLite in-memory, but the global `Base` gets polluted when other tests import `app.main` / `app.api.routes`, which registers GeoAlchemy2 `Geometry` columns.
  - ✅ **FIXED**: Rewrote `test_auth.py` to use Postgres test database (same as integration tests), eliminating SQLite/SpatiaLite compatibility issues.
- [ ] Verify public/private access rules with real HTTP calls:
  - Public route readable without auth.
  - Private route should return `401` when unauthenticated and `404` for non-owner authenticated users.

## Hygiene

- [x] Remove the stray test artifact file: `backend/file::memory:` (untracked).
  - ✅ **FIXED**: File was not present in repository.
- [ ] Address `npm audit` output (currently reports high severity vulnerabilities after install).
  - Web: ✅ 0 vulnerabilities found.
  - Mobile: ⚠️ 4 high severity vulnerabilities in `tar` via `@expo/cli` → requires Expo upgrade (breaking change).
