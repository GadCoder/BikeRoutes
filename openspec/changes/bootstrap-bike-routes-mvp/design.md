## Context

This change initializes the Bicycle Route Builder MVP from an implementation plan into a delivery-ready architecture spanning web, mobile, backend, geospatial storage, and self-hosted map tiles. The system must support authenticated route creation, marker management, public route sharing/discovery, and offline-capable route viewing on mobile while staying operable on a single VPS.

UI alignment note (mobile):
- The initial load / splash screen MUST use the product name "BikeRoutes" (not any other title).
- It MUST present a simple branded loading state while session restore (token refresh) is attempted and the map subsystem initializes.
- Visual composition (match provided reference):
  - Minimal, very light background (white/very light gray) with a soft, subtle teal/blue glow in the upper-left area.
  - Centered logo mark: a circular white badge containing a simple bicycle glyph.
  - A thin teal route-stroke/curve running behind/through the logo badge.
  - Wordmark below the logo: "BikeRoutes" with a two-tone treatment (dark gray for "Bike", accent teal for "Routes") or an equivalent emphasis.
  - Small uppercase subtitle under the wordmark: "URBAN ROUTE EDITOR".
  - Near-bottom loading label: "INITIALIZING MAPS..." in small uppercase.
  - A thin horizontal progress indicator directly below the label (can be indeterminate).
  - iOS-safe spacing: keep content clear of the notch/status bar and bottom home indicator.

UI alignment note (mobile auth):
- The Sign In screen SHOULD match the provided reference layout and visual language:
  - Very light background with subtle repeated wave/contour pattern.
  - Centered app icon at top (bike glyph in a rounded square with soft glow/shadow).
  - Headline: "Sign In".
  - Subheadline: "Welcome back! Ready for your next ride?"
  - Form fields:
    - Email Address input (placeholder similar to "rider@example.com").
    - Password input with obscured characters.
    - "Forgot Password?" link aligned to the right of the Password label row.
  - Primary CTA: wide, rounded button labeled "Sign In" with a right arrow indicator.
  - Divider text: "OR CONNECT WITH".
  - Social login row: ONLY a Google button (Apple login MUST NOT be shown).
    - If Google sign-in is not implemented/configured in MVP, the UI MUST hide this button rather than show a dead control.
  - Footer: "Don't have an account? Create Account" with "Create Account" styled as a link.

UI alignment note (mobile route creation):
- Route creation MUST be map-first with a persistent bottom sheet editor, matching the provided reference:
  - Map canvas visible behind all controls.
  - Top-left: circular back button.
  - Top-right: stacked circular map controls (layers/style toggle and locate/target).
  - Route polyline drawn in accent teal with round vertices (white fill + teal stroke).
  - Bottom sheet (rounded, elevated):
    - Left side: undo and redo buttons (icon buttons).
    - Center: step title and progress: "Draw Path" and "Step 1 of 3".
    - Right side: "Clear" action to reset current draft geometry.
    - Hint row: info icon + "Tap map to add points".
    - Metrics row: two cards:
      - "DISTANCE" with live-updating distance value (e.g., "4.2 km").
      - "VERTICES" with live-updating count (e.g., "5 pts").
    - Primary CTA: full-width "Next" button with right arrow.
  - Step progression:
    - Step 1 (Draw Path): add vertices by tapping map.
    - Step 2/3 and Step 3/3 MUST follow the same bottom-sheet structure (title + step count + metrics + primary CTA), even if the content differs (e.g., editing, review).

UI alignment note (mobile route saving):
- Saving a route MUST use a modal bottom sheet matching the provided reference:
  - Title: "Save Your Route".
  - Top-right: circular close button with an X.
  - Form fields:
    - "Route Name" (required).
    - "Notes (Optional)" multiline field.
  - Summary cards row:
    - Distance card (label "DISTANCE", numeric value + "km").
    - Markers card (label "MARKERS", value like "8 placed").
  - Primary CTA: full-width button "Save to My Routes" with a leading check icon.

UI alignment note (mobile marker adding):
- Adding a marker MUST use a modal bottom sheet matching the provided reference:
  - Title: "Add Marker"
  - Subtitle: "Specify details for this location"
  - Field: "MARKER LABEL" text input (placeholder similar to "e.g. Sunny Rest Stop")
  - Icon selector row under "SELECT ICON":
    - Four circular icon options with labels: "CAFE", "VIEWPOINT", "REPAIR", "WATER"
    - Selected state uses the primary accent teal background with white icon/label emphasis.
  - Field: "DESCRIPTION (OPTIONAL)" multiline input (placeholder text for notes).
  - Primary CTA: full-width button labeled "Add Marker"
  - Secondary action: centered text button "Cancel" below the primary CTA.

UI alignment note (mobile my routes):
- The "My Routes" screen MUST match the provided reference:
  - Top app bar:
    - Title: "My Routes"
    - Right: circular "+" button to start creating a new route (enters editor flow).
  - Search input below title with placeholder similar to "Search routes...".
  - Route list:
    - Card-based list with rounded cards and light shadow/elevation.
    - Each route card contains:
      - Route title.
      - A compact metadata row with icons and values:
        - Distance (km).
        - Marker count (e.g., "4 markers").
        - Recency/updated indicator (e.g., "2d ago").
      - A thumbnail preview area (map/route preview image).
      - A small trailing delete/trash icon button for quick delete (MUST confirm before deletion).
  - Bottom navigation:
    - MVP constraint: the app MUST NOT show tabs/screens that do not exist in MVP (no "Explore" screen and no "Stats" screen for now).
    - Use a consistent bottom navigation that only includes implemented MVP destinations (TBD; see note below).

UI alignment note (mobile my routes empty state):
- When the user has no saved routes, the My Routes screen MUST match the provided reference empty state:
  - Map remains visible in the background with the standard floating map controls.
  - Bottom sheet displays:
    - Title: "My Routes"
    - Right-side circular "+" button remains available.
    - Centered illustration/empty icon (bike glyph) with soft glow.
    - Headline: "No routes yet"
    - Supporting text encouraging drawing a route.
    - Primary CTA: "Start Drawing" (enters the route creation flow).

UI alignment note (mobile single route details):
- The single route details screen MUST match the provided reference:
  - Top header area:
    - Large route title.
    - Optional difficulty tag/badge on the right (e.g., "EXPERT") with a light pill style.
    - Subtitle line: "Created by <name> • <relative time>" (generic author string; no social features required).
  - Stats row:
    - Four compact stat cards for: Distance, Elev (elevation gain), Markers, Time.
  - Primary actions row:
    - Primary button: "Edit Route" (pencil icon optional).
    - Two secondary square buttons to the right:
      - Share (share icon).
      - Visibility/public toggle or link/share action (globe/link-style icon).
  - Content sections:
    - "Description" section with body text.
    - "Route Markers" section:
      - Right aligned "View All" link.
      - List row/card previewing markers (includes marker index badge, name, and small metadata like distance along route and/or elevation).
  - Bottom navigation:
    - MVP constraint: do not show non-MVP destinations (no "Explore", no "Stats").
    - Avoid per-screen tab set changes; navigation SHOULD remain consistent across the app.

Open question (MVP navigation):
- Confirm the MVP bottom tab set to use across all screens. Suggested: "My Routes" / "Editor" / "Profile" (or "Settings").

UI theming (minimalist, palette-locked):
- Visual direction: minimalist, clean surfaces, generous whitespace, low-contrast borders, and a single strong accent for primary actions.
- Use this palette as the source of truth (do not introduce additional saturated colors outside semantic states):
  - --deep-space-blue: #012a4a
  - --yale-blue: #013a63
  - --yale-blue-2: #01497c
  - --yale-blue-3: #014f86
  - --rich-cerulean: #2a6f97
  - --cerulean: #2c7da0
  - --air-force-blue: #468faf
  - --steel-blue: #61a5c2
  - --sky-blue-light: #89c2d9
  - --light-blue: #a9d6e5

Token mapping (recommended):
- Background:
  - app background: #ffffff (primary) with optional very subtle tint using --light-blue at low opacity.
  - map overlays/sheets: #ffffff.
- Text:
  - primary text: --deep-space-blue.
  - secondary text: --yale-blue (or 70-80% opacity of primary).
  - muted/help text: --rich-cerulean (or 60-70% opacity).
- Borders/dividers:
  - hairline borders: --light-blue (low opacity).
  - active borders/focus rings: --cerulean.
- Primary action:
  - primary button background: --cerulean.
  - primary button hover/pressed: darken toward --rich-cerulean / --yale-blue-3.
  - primary button text/icons: #ffffff.
- Secondary action:
  - secondary button background: #ffffff with border --light-blue.
  - secondary button text/icons: --yale-blue-3.
- Selection/active states:
  - active tab/icon: --cerulean.
  - inactive tab/icon: --steel-blue (or reduced opacity).
- Cards:
  - card background: #ffffff.
  - card shadow: minimal (soft, low alpha) rather than heavy elevation.
  - metric/stat cards: optional very light fill using --light-blue at low opacity.

Accessibility constraints:
- Ensure all text meets WCAG AA contrast on its background.
- Avoid using the light blues as text colors on white backgrounds except for disabled/muted hints with sufficient contrast.

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
