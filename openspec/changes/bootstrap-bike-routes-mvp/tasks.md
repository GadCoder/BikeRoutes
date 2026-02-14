## PR Format (Required)

All agent PRs MUST use the `pr-creator` skill template for the PR body:
1. Summary
2. Why
3. What Changed
4. Considerations

## 1. MVP Track A: Repo & Local Infra

These tasks unblock all other tracks and should be done first.

- [x] 1.1 Create baseline repository structure for `frontend/web`, `frontend/mobile`, `frontend/shared`, `backend`, `infra`, and `maps`.
- [x] 1.2 Initialize React web app (Vite + TypeScript), FastAPI backend skeleton, and Expo mobile app shell (branded as "BikeRoutes", including the reference splash screen: logo badge + teal route stroke, subtitle "URBAN ROUTE EDITOR", and "INITIALIZING MAPS..." progress indicator).
- [x] 1.3 Add Docker Compose services for PostgreSQL/PostGIS, backend API, and tile serving dependencies.
- [x] 1.4 Add shared environment templates (`.env.example`) and local startup scripts for web, backend, and mobile.
- [x] 1.5 Standardize backend runtime on Python **3.13** for local dev/QA stability (see `docs/DEV.md`).

## 2. MVP Track B: Backend Auth

Backend auth can be built in parallel with backend route/marker APIs and mobile UI (which can start with mocked data).

- [x] 2.1 Implement users and refresh token database models and create Alembic migrations.
- [x] 2.2 Implement `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/me` endpoints.
- [x] 2.3 Implement JWT middleware/dependencies to protect mutation endpoints and identify current user.
- [x] 2.4 Implement refresh token rotation, hashed token persistence, and revocation-on-reuse logic.

## 3. MVP Track C: Backend Routes & Markers

Routes/markers APIs can be built in parallel with auth, but final ownership/visibility enforcement depends on `2.3`.

- [x] 3.1 Implement route and marker SQLAlchemy models with PostGIS geometry fields and required indexes/constraints.
- [x] 3.2 Implement route CRUD endpoints with ownership checks and visibility enforcement.
- [x] 3.3 Implement marker CRUD endpoints nested under routes with ownership checks.
- [x] 3.4 Implement GeoJSON serialization contracts for route and marker responses.
- [x] 3.5 Implement server-side canonical route distance calculation from geometry and ignore client-supplied distance.

## 4. MVP Track D: Mobile UI + Editor

Mobile UI can start immediately with local/mocked data. API wiring requires `2.2-2.3` and `3.2-3.4`. MVP must not include Explore/Stats screens.

- [x] 2.5 Implement frontend and mobile auth flows (session storage, login/register screens, authenticated bootstrap) matching the mobile Sign In design: Google-only social option (no Apple; hide Google button if not configured).
  - [x] 2.5a UI auth flow implemented with mocked session (Sign In / Register / Authed bootstrap); Google hidden when not configured; dead controls removed.
  - [x] 2.5b Persist session (AsyncStorage/SecureStore) + wire to backend auth endpoints.
- [x] 6.1 Integrate MapLibre React Native and mobile map screen with shared geometry contracts, matching the route creation UI: step-based bottom sheet (Step 1 of 3) with undo/redo, Clear, distance/vertices metrics, and Next CTA.
- [x] 6.2 Implement mobile route list/detail views with local route cache persistence, matching the reference UI:
  - My Routes screen: title, search, + create button, card list with distance/markers/recency and thumbnail, delete icon with confirm, bottom nav (MVP must not include Explore/Stats).
  - My Routes empty state: "No routes yet" illustration + supporting text + "Start Drawing" CTA.
  - Route details screen: title + optional difficulty badge, created-by + relative time, stat cards (distance/elev/markers/time), Edit Route CTA, share/visibility buttons, description section, route markers preview + View All, bottom nav (MVP must not include Explore/Stats).
  - Include: Save Your Route modal (Route Name required, Notes optional, distance/markers summary, Save to My Routes CTA).
  - Include: Add Marker modal (label, icon selection: Cafe/Viewpoint/Repair/Water, optional description, Add Marker + Cancel).

## 5. MVP Track E: Sharing (Minimum)

Sharing requires routes to exist (`3.2`). Owner-only toggles require auth identity (`2.3`).

- [x] 5.1 Implement route visibility toggle (`is_public`) and share token generation.
- [x] 5.2 Implement `/api/routes/share/{token}` route access endpoint with not-found handling.

## 6. Post-MVP (Defer): Web Parity

- [x] 4.1 Integrate MapLibre GL JS with city-centered default view and baseline controls.
- [x] 4.2 Implement manual route drawing, vertex editing, and undo/redo behavior in the web editor (keep parity with mobile's step-based editor concepts where possible).
- [x] 4.3 Implement marker placement, repositioning, and metadata editing in editor UX.
- [x] 4.4 Implement save/load/update/delete route flows integrated with backend APIs.
- [x] 4.5 Implement "My Routes" page with route list, edit entry, and delete confirmation.

## 7. Post-MVP (Defer): Discovery

- [ ] 5.3 Implement paginated public discovery endpoint behavior with search, sort, and bbox filters.
- [ ] 5.4 Implement web public routes listing page with route cards and basic filter controls.

## 8. Post-MVP (Defer): Offline Download + Sync Queue

- [ ] 6.3 Implement offline map area download and offline tile usage for previously downloaded regions.
- [ ] 6.4 Implement offline mutation queueing and reconnect synchronization for route/marker changes.

## 9. Post-MVP (Recommended Before Public Launch): Hardening & Deployment

- [ ] 7.1 Add backend and frontend tests for auth, route permissions, marker CRUD, and discovery filtering.
- [ ] 7.2 Add API/health logging baseline and production readiness checks.
- [ ] 7.3 Create production Docker Compose and Caddy configuration for TLS termination and reverse proxying.
- [ ] 7.4 Add GitHub Actions pipeline for build/test and VPS deployment workflow.
- [ ] 7.5 Document API usage and deployment runbooks in `docs/API.md` and `docs/DEPLOYMENT.md`.
