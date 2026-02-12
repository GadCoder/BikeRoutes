## Context

This change initializes the Bicycle Route Builder MVP from an implementation plan into a delivery-ready architecture spanning web, mobile, backend, geospatial storage, and self-hosted map tiles. The system must support authenticated route creation, marker management, public route sharing/discovery, and offline-capable route viewing on mobile while staying operable on a single VPS.

## Goals / Non-Goals

**Goals:**
- Define a cohesive architecture for React web, React Native mobile, FastAPI services, and PostgreSQL/PostGIS.
- Standardize route and marker contracts around GeoJSON payloads and server-side canonical distance calculations.
- Define authorization boundaries so only owners can mutate private assets while public read access is supported.
- Support MVP offline behavior for mobile route/map viewing with local persistence and deferred sync.
- Keep deployment and runtime topology simple enough for Docker Compose on one host.

**Non-Goals:**
- Bike-optimized turn-by-turn routing in MVP.
- Social features such as comments, ratings, or collaborative editing.
- Multi-city tenancy and complex geo-partitioning in MVP.
- Real-time synchronization/conflict resolution for concurrent route edits.

## Decisions

1. Frontend platform split: React (web) + React Native Expo (mobile), with shared TypeScript contracts.
- Rationale: Maximizes delivery speed and reuse while preserving native mobile UX.
- Alternative considered: Flutter or native-first split stacks; rejected due to lower code sharing with planned web stack.

2. Backend and data layer: FastAPI + SQLAlchemy 2.0 + Postgres 16 + PostGIS 3.4.
- Rationale: Provides strong geospatial query capability and mature async API development.
- Alternative considered: Node/NestJS + Prisma; rejected because PostGIS integration and geospatial workflows are more direct with GeoAlchemy/PostGIS-native patterns.

3. Geometry contract: Route and marker geometries are persisted in PostGIS and exposed as GeoJSON features.
- Rationale: Keeps client/server interchange standard and map-engine-agnostic.
- Alternative considered: custom coordinate arrays without GeoJSON wrapper; rejected due to weaker interoperability and future export complexity.

4. Distance authority: Client may preview route distance, but server computes canonical `distance_km` from persisted geometry.
- Rationale: Prevents client drift/manipulation and provides one trusted value for sorting/filtering.
- Alternative considered: trust client-calculated distance; rejected for integrity concerns.

5. Auth model: JWT access + refresh tokens, refresh rotation with server-side hashed token storage and revocation.
- Rationale: Works for web/mobile, supports secure session continuity without sticky backend sessions.
- Alternative considered: stateless long-lived JWT only; rejected due to revocation limitations.

6. Tile stack: PMTiles assets served by Martin, map rendering via MapLibre on web/mobile.
- Rationale: Single-file tiles simplify hosting and offline use; MapLibre ensures stack consistency.
- Alternative considered: hosted proprietary map APIs; rejected for recurring cost and lower control.

7. Offline-first scope: mobile caches downloaded map areas and route data locally, then syncs pending mutations when online.
- Rationale: Matches MVP requirement without introducing complex bidirectional merge logic.
- Alternative considered: full offline editing conflict-resolution engine in v1; deferred due to complexity.

## Risks / Trade-offs

- [Cross-platform map parity gaps] -> Mitigation: define shared geometry/event contracts and run parity smoke tests on both web and mobile each sprint.
- [Geo query performance degradation as public routes grow] -> Mitigation: enforce GIST indexes, bbox-limited queries, and paginated listing defaults.
- [Token theft/session abuse] -> Mitigation: short-lived access tokens, rotated refresh tokens, hashed token persistence, and revoke-on-reuse logic.
- [Offline cache inconsistency] -> Mitigation: version route payloads, keep last-write-wins policy for MVP, and expose sync status to users.
- [Single-host outage risk] -> Mitigation: daily DB backups, PMTiles artifact backup, health checks, and documented restore runbook.

## Migration Plan

1. Scaffold repository structure for `frontend/web`, `frontend/mobile`, `frontend/shared`, `backend`, `infra`, and `maps`.
2. Provision local Docker Compose services (Postgres/PostGIS, backend API, tile server) and baseline env config.
3. Apply initial migrations for users, routes, markers, and refresh_tokens with spatial indexes and constraints.
4. Implement auth endpoints and middleware, then route/marker CRUD endpoints and GeoJSON serialization.
5. Implement web MVP flows (auth, map view, route editor, route list, sharing/discovery).
6. Implement mobile MVP flows with offline route/map cache and sync on reconnect.
7. Deploy to VPS with Caddy TLS termination, CI/CD pipeline, and backup/health monitoring.

Rollback strategy:
- Keep versioned DB migrations with downgrade paths.
- Use blue/green-like compose project naming for safe cutover when feasible.
- Retain previous PMTiles/style artifacts and image tags for rapid rollback.

## Open Questions

- Should share links be revocable/regenerable per route in MVP, or immutable once created?
- Which offline map area selection UX is acceptable for MVP (preset city region vs custom bounding box)?
- What initial rate-limiting thresholds should be enforced on auth and public discovery endpoints?
