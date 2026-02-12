## 1. Monorepo and Local Infrastructure Setup

- [ ] 1.1 Create baseline repository structure for `frontend/web`, `frontend/mobile`, `frontend/shared`, `backend`, `infra`, and `maps`.
- [ ] 1.2 Initialize React web app (Vite + TypeScript), FastAPI backend skeleton, and Expo mobile app shell.
- [ ] 1.3 Add Docker Compose services for PostgreSQL/PostGIS, backend API, and tile serving dependencies.
- [ ] 1.4 Add shared environment templates (`.env.example`) and local startup scripts for web, backend, and mobile.

## 2. Authentication and Authorization

- [ ] 2.1 Implement users and refresh token database models and create Alembic migrations.
- [ ] 2.2 Implement `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/me` endpoints.
- [ ] 2.3 Implement JWT middleware/dependencies to protect mutation endpoints and identify current user.
- [ ] 2.4 Implement refresh token rotation, hashed token persistence, and revocation-on-reuse logic.
- [ ] 2.5 Implement frontend and mobile auth flows (session storage, login/register screens, authenticated bootstrap).

## 3. Route and Marker API Implementation

- [ ] 3.1 Implement route and marker SQLAlchemy models with PostGIS geometry fields and required indexes/constraints.
- [ ] 3.2 Implement route CRUD endpoints with ownership checks and visibility enforcement.
- [ ] 3.3 Implement marker CRUD endpoints nested under routes with ownership checks.
- [ ] 3.4 Implement GeoJSON serialization contracts for route and marker responses.
- [ ] 3.5 Implement server-side canonical route distance calculation from geometry and ignore client-supplied distance.

## 4. Web Map Editor and Route Workflows

- [ ] 4.1 Integrate MapLibre GL JS with city-centered default view and baseline controls.
- [ ] 4.2 Implement manual route drawing, vertex editing, and undo/redo behavior in the web editor.
- [ ] 4.3 Implement marker placement, repositioning, and metadata editing in editor UX.
- [ ] 4.4 Implement save/load/update/delete route flows integrated with backend APIs.
- [ ] 4.5 Implement "My Routes" page with route list, edit entry, and delete confirmation.

## 5. Sharing and Discovery Features

- [ ] 5.1 Implement route visibility toggle (`is_public`) and share token generation.
- [ ] 5.2 Implement `/api/routes/share/{token}` route access endpoint with not-found handling.
- [ ] 5.3 Implement paginated public discovery endpoint behavior with search, sort, and bbox filters.
- [ ] 5.4 Implement web public routes listing page with route cards and basic filter controls.

## 6. Mobile Offline Route Access

- [ ] 6.1 Integrate MapLibre React Native and mobile map screen with shared geometry contracts.
- [ ] 6.2 Implement mobile route list/detail views with local route cache persistence.
- [ ] 6.3 Implement offline map area download and offline tile usage for previously downloaded regions.
- [ ] 6.4 Implement offline mutation queueing and reconnect synchronization for route/marker changes.

## 7. Delivery Hardening and Deployment

- [ ] 7.1 Add backend and frontend tests for auth, route permissions, marker CRUD, and discovery filtering.
- [ ] 7.2 Add API/health logging baseline and production readiness checks.
- [ ] 7.3 Create production Docker Compose and Caddy configuration for TLS termination and reverse proxying.
- [ ] 7.4 Add GitHub Actions pipeline for build/test and VPS deployment workflow.
- [ ] 7.5 Document API usage and deployment runbooks in `docs/API.md` and `docs/DEPLOYMENT.md`.
