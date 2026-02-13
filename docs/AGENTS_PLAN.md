# Agents Parallel Execution Plan (BikeRoutes MVP)

This document describes how to execute the MVP tasks in parallel using multiple agents with `git worktree`, minimizing conflicts and keeping PRs reviewable.

## Source Of Truth

- OpenSpec change: `openspec/changes/bootstrap-bike-routes-mvp/`
- Task list (tracked by OpenSpec): `openspec/changes/bootstrap-bike-routes-mvp/tasks.md`

## Hard Rules (Sanity + Conflict Avoidance)

1. One agent = one worktree + one branch. No agent commits directly to `main`.
2. Keep PRs small and frequent. Prefer task-scoped PRs over large feature dumps.
3. Respect file ownership boundaries (below). If you must touch another area, coordinate and keep changes minimal.
4. Avoid breaking API/contract changes once the mobile integration starts.
5. Migrations must remain linear: resolve alembic heads promptly after merges.
6. **Backend tooling standard**: for backend-related work (FastAPI, Alembic, scripts), use `uv` as the Python project/dependency manager (not Poetry, not `pip install -r ...`).

## PR Format (Required)

All agent PRs MUST use the `pr-creator` skill template for the PR body:

1. Summary
2. Why
3. What Changed
4. Considerations

## Worktree Setup

Run from the repo root:

```bash
git fetch origin
git checkout main
git pull --ff-only

mkdir -p /tmp/bikeroutes-wt

git worktree add /tmp/bikeroutes-wt/agent-infra -b agent/infra main
git worktree add /tmp/bikeroutes-wt/agent-backend-auth -b agent/backend-auth main
git worktree add /tmp/bikeroutes-wt/agent-backend-routes -b agent/backend-routes main
git worktree add /tmp/bikeroutes-wt/agent-mobile-ui -b agent/mobile-ui main
git worktree add /tmp/bikeroutes-wt/agent-sharing -b agent/sharing main
```

## Ownership Boundaries

- Agent Infra owns:
  - `infra/`
  - root `.env.example`
  - root `scripts/`
  - shared directory scaffolding only (if needed)
- Agent Backend Auth owns:
  - `backend/` auth modules
  - auth-related DB models and migrations
- Agent Backend Routes owns:
  - `backend/` routes/markers modules
  - route/marker DB models and migrations
- Agent Mobile UI owns:
  - `frontend/mobile/`
  - minimal `frontend/shared/` types (only when necessary)
- Agent Sharing owns:
  - backend route sharing surface area
  - minimal mobile wiring for share actions (if not owned by Mobile UI)

## Parallel Tracks (Aligned To OpenSpec)

### Agent A: Repo & Local Infra (MVP Track A: tasks `1.1–1.4`)

Goal: unblock everyone quickly.

Deliverables:
- PR-A1: repo structure + `.env.example` + dev scripts + compose skeleton
- PR-A2: compose integration polish (ports, volumes, service naming), if needed

Notes:
- Keep this PR limited to infra and scaffolding. Avoid implementing auth/routes/mobile logic here.

### Agent B: Backend Auth (MVP Track B: tasks `2.1–2.4`)

Goal: working email/password auth with refresh rotation.

Deliverables:
- PR-B1: DB models + alembic migrations (`users`, `refresh_tokens`)
- PR-B2: auth endpoints + JWT dependency/middleware + minimal tests

Dependencies:
- Can start immediately. Compose/env from PR-A1 makes local testing easier.

### Agent C: Backend Routes & Markers (MVP Track C: tasks `3.1–3.5`)

Goal: routes + markers CRUD, ownership enforcement, GeoJSON, canonical distance.

Deliverables:
- PR-C1: DB models + migrations (`routes`, `markers` with PostGIS geometry + indexes)
- PR-C2: CRUD endpoints + permission checks (final enforcement depends on `2.3`)
- PR-C3: GeoJSON serialization + distance calculation

Dependencies:
- Can start in parallel with auth.
- Final ownership enforcement requires the auth dependency interface from Agent B (`2.3`).

### Agent D: Mobile UI + Editor (MVP Track D: tasks `2.5`, `6.1–6.2`)

Goal: implement mobile screens matching the provided references, then wire to APIs.

Deliverables:
- PR-D1: app theme tokens (palette-locked), splash screen, sign-in screen (Google button only if configured; otherwise hidden)
- PR-D2: route creation UI (step-based bottom sheet, undo/redo scaffolding, distance/vertices cards, Next CTA)
- PR-D3: My Routes list + empty state + route details + marker add modal + save route modal
- PR-D4: API integration pass (auth + routes + markers) once backend endpoints are stable

Dependencies:
- UI can start immediately with mocked local state.
- API wiring depends on Agent B (`2.2–2.3`) and Agent C (`3.2–3.4`).

### Agent E: Sharing Minimum (MVP Track E: tasks `5.1–5.2`)

Goal: public/private + share token endpoint.

Deliverables:
- PR-E1: backend changes for `is_public` + share token generation + `/api/routes/share/{token}` endpoint
- PR-E2: mobile wiring for share actions (if not done by Agent D)

Dependencies:
- Requires routes (`3.2`).
- Owner-only toggles require auth identity (`2.3`).

## Merge / Integration Order (Recommended)

1. Merge PR-A1 (infra baseline).
2. Merge PR-B1 and PR-C1 (DB foundations) next.
3. Merge PR-B2 and PR-C2/C3 (endpoints usable).
4. Merge PR-D1/D2/D3 anytime (mocked UI), then PR-D4 once backend is ready.
5. Merge PR-E1 after routes land, then PR-E2/PR-D4 share wiring.

## Coordination Checkpoints

- Auth contract checkpoint:
  - Confirm JWT claims, error formats, and `get_current_user` shape.
- Route contract checkpoint:
  - Confirm GeoJSON response shape and marker embedding.
- Migration checkpoint:
  - Resolve alembic head divergence after PR-B1 and PR-C1 merge.

## Definition Of Done (MVP)

- User can sign in (email/password).
- User can draw a route, add markers, and save.
- User can view My Routes list (with empty state) and open a route detail screen.
- User can toggle public/private and access a share-token route endpoint.
- MVP must not include Explore or Stats screens.
