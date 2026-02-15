# Bicycle Route Builder — Implementation Plan

## Project Summary

A web and mobile application for creating, sharing, and viewing bicycle routes with points of interest on a modern, clean vector map.

### Key Requirements (from discovery)

| Aspect | Decision |
|--------|----------|
| Route creation | Anyone can create; registration required to save |
| Routing mode | Manual drawing (Phase 1), bike-optimized routing (Phase 2+) |
| Offline support | Yes — view routes + download map areas |
| Map scope | Single city (initial) |
| Map style | Clean modern vector theme (Uber-inspired) |
| Animations | Smooth camera, route playback, marker clustering |
| Social features | None for MVP |
| Auth | Yes — required for saving routes |
| Collaboration | CRUD only (no real-time) |
| Scale | Personal → hundreds of users |
| Mobile parity | Same features as web |
| Tech stack | JS ecosystem (React + React Native) |

---

## Technology Stack

### Frontend (Web)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | **React 18+** with TypeScript | Industry standard, excellent ecosystem |
| Build tool | **Vite** | Fast dev experience, modern bundling |
| Map engine | **MapLibre GL JS** | Open-source, vector tiles, Uber-style capable |
| State | **Zustand** | Lightweight, simple API, good for spatial state |
| Data fetching | **TanStack Query** | Caching, background sync, offline support |
| Routing | **React Router v6** | Standard SPA routing |
| Styling | **Tailwind CSS** | Rapid UI development, consistent design |
| UI components | **Radix UI** | Accessible primitives |

### Frontend (Mobile)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | **React Native** + Expo | Code sharing with web, faster iteration |
| Map engine | **MapLibre React Native** | Consistent with web, offline tile support |
| Navigation | **Expo Router** | File-based routing, deep linking |
| Storage | **MMKV** + **WatermelonDB** | Fast KV + offline-first SQLite |

### Backend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | **FastAPI** | Async, fast, great DX, auto OpenAPI docs |
| ORM | **SQLAlchemy 2.0** + **GeoAlchemy2** | Async support, PostGIS integration |
| Auth | **JWT** (access + refresh tokens) | Stateless, mobile-friendly |
| Validation | **Pydantic v2** | Built into FastAPI, fast |
| Migrations | **Alembic** | Standard for SQLAlchemy |

### Database

| Component | Technology |
|-----------|------------|
| Primary DB | **PostgreSQL 16** |
| Spatial extension | **PostGIS 3.4** |

### Map Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Tile generation | **Planetiler** | Fast OSM → vector tiles |
| Tile server | **Martin** | Rust-based, lightweight, fast |
| Style editor | **Maputnik** | Visual style editing |
| Tile format | **PMTiles** | Single-file, HTTP range requests |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Reverse proxy | **Caddy** | Auto HTTPS, simple config |
| Containerization | **Docker Compose** | Single-host orchestration |
| CI/CD | **GitHub Actions** | Build, test, deploy |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPS (4 cores / 8GB)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │  Caddy  │───▶│  React SPA   │    │  React Native App   │    │
│  │ :443    │    │  (static)    │    │  (mobile stores)    │    │
│  └────┬────┘    └──────────────┘    └──────────┬──────────┘    │
│       │                                         │               │
│       ▼                                         ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FastAPI Backend                       │   │
│  │                      :8000                               │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────┐  │   │
│  │  │  Auth   │  │ Routes  │  │ Markers │  │   Users    │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────────┘  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│       ┌─────────────────┼─────────────────┐                    │
│       ▼                 ▼                 ▼                    │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────┐           │
│  │ Martin  │    │  PostgreSQL  │    │   PMTiles   │           │
│  │  :3000  │    │   + PostGIS  │    │   (files)   │           │
│  │ (tiles) │    │    :5432     │    │             │           │
│  └─────────┘    └──────────────┘    └─────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### ERD

```
┌──────────────────┐       ┌──────────────────────┐
│      users       │       │        routes        │
├──────────────────┤       ├──────────────────────┤
│ id (UUID) PK     │──┐    │ id (UUID) PK         │
│ email            │  │    │ user_id FK           │◀──┐
│ password_hash    │  └───▶│ title                │   │
│ display_name     │       │ description          │   │
│ created_at       │       │ geometry (LINESTRING)│   │
│ updated_at       │       │ distance_km          │   │
└──────────────────┘       │ is_public            │   │
                           │ share_token          │   │
                           │ created_at           │   │
                           │ updated_at           │   │
                           └──────────────────────┘   │
                                      │               │
                                      ▼               │
                           ┌──────────────────────┐   │
                           │       markers        │   │
                           ├──────────────────────┤   │
                           │ id (UUID) PK         │   │
                           │ route_id FK          │───┘
                           │ geometry (POINT)     │
                           │ label                │
                           │ description          │
                           │ icon_type            │
                           │ order_index          │
                           │ created_at           │
                           └──────────────────────┘
```

### SQL Schema (simplified)

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
    distance_km DECIMAL(10, 2),
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(32) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    geometry GEOMETRY(POINT, 4326) NOT NULL,
    label VARCHAR(100),
    description TEXT,
    icon_type VARCHAR(50) DEFAULT 'default',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial indexes
CREATE INDEX idx_routes_geometry ON routes USING GIST(geometry);
CREATE INDEX idx_markers_geometry ON markers USING GIST(geometry);
CREATE INDEX idx_routes_user ON routes(user_id);
CREATE INDEX idx_routes_public ON routes(is_public) WHERE is_public = TRUE;

-- Ensure stable marker ordering within a route
CREATE UNIQUE INDEX idx_markers_route_order_unique ON markers(route_id, order_index);

-- Keep updated_at accurate on every update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_routes_updated_at
BEFORE UPDATE ON routes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Refresh token storage for rotation + revocation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    replaced_by_token_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

---

## API Design

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Get tokens |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/me` | GET | Current user info |

### Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/routes` | GET | Optional | List public routes (+ own if auth), paginated |
| `/api/routes` | POST | Required | Create route |
| `/api/routes/{id}` | GET | Optional | Get route (public or own) |
| `/api/routes/{id}` | PUT | Required | Update own route |
| `/api/routes/{id}` | DELETE | Required | Delete own route |
| `/api/routes/share/{token}` | GET | No | Get route by share token |

`GET /api/routes` query params:
- `page` (default `1`)
- `page_size` (default `20`, max `100`)
- `sort` (`created_at` | `updated_at` | `distance_km`)
- `order` (`asc` | `desc`)
- `q` (optional title search)
- `bbox` (optional map bounds filter)

### Markers

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/routes/{id}/markers` | GET | Optional | List markers for route |
| `/api/routes/{id}/markers` | POST | Required | Add marker |
| `/api/routes/{id}/markers/{mid}` | PUT | Required | Update marker |
| `/api/routes/{id}/markers/{mid}` | DELETE | Required | Delete marker |

### Response Format (GeoJSON)

```json
{
  "id": "uuid",
  "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [[lng, lat], ...]
  },
  "properties": {
    "title": "Morning Ride",
    "description": "...",
    "distance_km": 12.5,
    "is_public": true,
    "markers": [
      {
        "id": "uuid",
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [lng, lat] },
        "properties": { "label": "Coffee Shop", "icon_type": "cafe" }
      }
    ]
  }
}
```

---

## Project Structure

```
bike-routes/
├── frontend/
│   ├── web/                          # React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── map/              # Map components
│   │   │   │   │   ├── MapView.tsx
│   │   │   │   │   ├── RouteLayer.tsx
│   │   │   │   │   ├── MarkerLayer.tsx
│   │   │   │   │   └── DrawingTools.tsx
│   │   │   │   ├── ui/               # Shared UI components
│   │   │   │   └── layout/           # Layout components
│   │   │   ├── features/
│   │   │   │   ├── auth/             # Auth pages + logic
│   │   │   │   ├── routes/           # Route CRUD
│   │   │   │   └── editor/           # Route editor
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── api/                  # API client
│   │   │   ├── lib/                  # Utilities
│   │   │   └── styles/               # Global styles
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── mobile/                       # React Native (Expo)
│   │   ├── app/                      # Expo Router pages
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── api/
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── shared/                       # Shared code (types, utils)
│       ├── types/
│       └── utils/
│
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app
│   │   ├── config.py                 # Settings
│   │   ├── database.py               # DB connection
│   │   ├── models/                   # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── route.py
│   │   │   └── marker.py
│   │   ├── schemas/                  # Pydantic schemas
│   │   ├── api/
│   │   │   ├── deps.py               # Dependencies
│   │   │   ├── auth.py
│   │   │   ├── routes.py
│   │   │   └── markers.py
│   │   ├── services/                 # Business logic
│   │   └── utils/
│   ├── alembic/                      # Migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── maps/
│   ├── tiles/                        # PMTiles files
│   │   └── city.pmtiles
│   ├── styles/
│   │   └── bike-friendly.json        # MapLibre style
│   └── scripts/
│       └── generate-tiles.sh         # Planetiler script
│
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Caddyfile
│   └── .env.example
│
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── IMPLEMENTATION_PLAN.md            # This file
├── ARCHITECTURE.md
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

#### 1.1 Project Setup
- [ ] Initialize monorepo structure
- [ ] Set up frontend/web with Vite + React + TypeScript
- [ ] Set up backend with FastAPI
- [ ] Configure Docker Compose for local development
- [ ] Set up PostgreSQL + PostGIS container

#### 1.2 Authentication System
- [ ] User model + migrations
- [ ] Registration endpoint
- [ ] Login endpoint (JWT)
- [ ] Token refresh mechanism
- [ ] Protected route middleware
- [ ] Frontend auth context + hooks

#### 1.3 Basic Map Integration
- [ ] Integrate MapLibre GL JS
- [ ] Load OpenStreetMap tiles (external CDN for now)
- [ ] Basic map controls (zoom, pan)
- [ ] Set initial view to target city
- [ ] Offline feasibility spike: validate PMTiles + MapLibre React Native on target devices

**Deliverable:** Users can register, login, and see a map.

---

### Phase 2: Route Editor (Week 3-4)

#### 2.1 Drawing Tools
- [ ] Polyline drawing mode
- [ ] Point-and-click route creation
- [ ] Vertex editing (drag to modify)
- [ ] Undo/redo functionality
- [ ] Distance preview in client (Turf.js), but compute canonical value server-side (PostGIS geography)

#### 2.2 Marker System
- [ ] Marker placement tool
- [ ] Marker popup editor (label, description)
- [ ] Icon type selection
- [ ] Drag markers to reposition
- [ ] Delete markers

#### 2.3 Route CRUD Backend
- [ ] Route model + migrations
- [ ] Marker model + migrations
- [ ] CRUD endpoints for routes
- [ ] CRUD endpoints for markers
- [ ] GeoJSON serialization
- [ ] Server-side distance calculation from geometry (ignore client-provided distance)

#### 2.4 Route CRUD Frontend
- [ ] Save route flow
- [ ] Load route from API
- [ ] My routes list
- [ ] Edit existing route
- [ ] Delete route confirmation

**Deliverable:** Users can draw routes, add markers, and save them.

---

### Phase 3: Sharing & Public Routes (Week 5)

#### 3.1 Sharing System
- [ ] Public/private toggle
- [ ] Generate share token
- [ ] Share link generation
- [ ] Public route viewer (no auth required)

#### 3.2 Route Discovery
- [ ] Public routes listing page
- [ ] Route cards with preview
- [ ] Basic search/filter

#### 3.3 UI Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Responsive design

**Deliverable:** Users can share routes and browse public routes.

---

### Phase 4: Map Styling & Animations (Week 6)

#### 4.1 Custom Map Style
- [ ] Download city OSM extract
- [ ] Generate PMTiles with Planetiler
- [ ] Create bike-friendly style in Maputnik
- [ ] Style elements: roads, paths, parks, water
- [ ] Bike lane highlighting

#### 4.2 Self-Hosted Tiles
- [ ] Set up Martin tile server
- [ ] Serve PMTiles
- [ ] Configure caching headers

#### 4.3 Animations
- [ ] Smooth camera transitions (flyTo)
- [ ] Route playback animation
- [ ] Marker clustering (Supercluster)
- [ ] Animated route drawing

**Deliverable:** Beautiful, custom-styled map with animations.

---

### Phase 5: Mobile App (Week 7-8)

#### 5.1 React Native Setup
- [ ] Initialize Expo project
- [ ] Configure MapLibre React Native
- [ ] Set up navigation (Expo Router)
- [ ] Shared API client

#### 5.2 Core Features
- [ ] Map view
- [ ] Route drawing (touch-based)
- [ ] Marker management
- [ ] Auth screens
- [ ] My routes list

#### 5.3 Offline Support
- [ ] Download PMTiles for offline use
- [ ] Cache routes locally (WatermelonDB)
- [ ] Offline route viewing
- [ ] Sync when online

**Deliverable:** Functional mobile app with offline support.

---

### Phase 6: Deployment & Production (Week 9)

#### 6.1 Production Infrastructure
- [ ] Production Docker Compose
- [ ] Caddy configuration (auto HTTPS)
- [ ] Environment configuration
- [ ] Database backups (pg_dump cron)

#### 6.2 CI/CD
- [ ] GitHub Actions workflow
- [ ] Build and test
- [ ] Deploy to VPS (SSH + Docker)

#### 6.3 Monitoring
- [ ] Basic logging
- [ ] Health check endpoints
- [ ] Error tracking (optional: Sentry)

**Deliverable:** Production deployment on VPS.

---

## Resource Estimates (VPS)

| Service | RAM | CPU | Storage |
|---------|-----|-----|---------|
| PostgreSQL + PostGIS | 1.5 GB | 0.5 core | 5 GB |
| Martin (tile server) | 256 MB | 0.25 core | - |
| FastAPI | 256 MB | 0.5 core | - |
| Caddy | 64 MB | 0.1 core | - |
| PMTiles (city) | - | - | 500 MB |
| **Total** | **~2.5 GB** | **~1.5 cores** | **~6 GB** |

Leaves comfortable headroom on your 4-core / 8 GB VPS.

---

## Development Workflow

### Local Development

```bash
# Start all services
docker compose up -d

# Frontend (hot reload)
cd frontend/web && npm run dev

# Backend (hot reload)
cd backend && uvicorn app.main:app --reload

# Mobile
cd frontend/mobile && npx expo start
```

### Key Commands

```bash
# Generate tiles (run once per city update)
./maps/scripts/generate-tiles.sh

# Run migrations
cd backend && alembic upgrade head

# Run tests
cd backend && pytest
cd frontend/web && npm test
```

---

## External Dependencies

| Dependency | Purpose | Free Tier |
|------------|---------|-----------|
| OpenStreetMap | Base map data | Yes (open data) |
| Geofabrik | OSM extracts | Yes |
| GitHub | Code hosting | Yes |
| (Optional) Sentry | Error tracking | 5K events/month |

No paid services required for MVP.

---

## Security Considerations

1. **Authentication**
   - bcrypt for password hashing
   - Short-lived access tokens (15 min)
   - Refresh tokens (7 days, rotated, stored as hashes, revocable)
   - HTTPS only (Caddy auto-certs)

2. **Authorization**
   - Users can only modify their own routes
   - Rate limiting on auth endpoints (FastAPI middleware, Redis-backed in production)
   - Input validation (Pydantic)

3. **Data**
   - Parameterized queries (SQLAlchemy)
   - CORS configured for known origins
   - No sensitive data in URLs

---

## Future Enhancements (Post-MVP)

| Feature | Complexity | Phase |
|---------|------------|-------|
| Bike-optimized routing (Valhalla) | High | 2.0 |
| Elevation profiles | Medium | 2.0 |
| GPX import/export | Low | 1.5 |
| Route ratings | Low | 1.5 |
| Comments | Medium | 2.0 |
| Photo attachments | Medium | 2.0 |
| Multi-city support | Medium | 2.0 |
| Real-time collaboration | High | 3.0 |
| Turn-by-turn navigation | High | 3.0 |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- (For mobile) Expo CLI

### First Steps

1. Clone repository
2. Copy `.env.example` to `.env`
3. Run `docker compose up -d` (starts DB + tile server)
4. Run backend: `cd backend && pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --reload`
5. Run frontend: `cd frontend/web && npm install && npm run dev`

---

## Summary

This implementation plan provides a structured approach to building a bicycle route creator with:

- **Modern UX**: Clean vector maps, smooth animations, intuitive drawing tools
- **Full stack**: React + FastAPI + PostgreSQL/PostGIS
- **Cross-platform**: Web + React Native with shared logic
- **Offline-first**: Downloaded tiles + cached routes
- **Self-hosted**: Complete control on a single VPS
- **Scalable**: Architecture supports growth to thousands of users

Total estimated development time: **8-9 weeks** for a solo developer working part-time, or **4-5 weeks** full-time.
