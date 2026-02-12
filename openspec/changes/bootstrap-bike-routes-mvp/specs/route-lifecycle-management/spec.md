## ADDED Requirements

### Requirement: Route CRUD with ownership enforcement
The system SHALL allow authenticated users to create, update, and delete only their own routes, and SHALL store route geometry as a PostGIS LineString.

#### Scenario: Create route
- **WHEN** an authenticated user submits valid route metadata and line geometry
- **THEN** the system persists a new route owned by that user

#### Scenario: Unauthorized route mutation
- **WHEN** an authenticated user attempts to update or delete a route owned by another user
- **THEN** the system denies the operation

### Requirement: Route retrieval by visibility rules
The system SHALL allow route retrieval when the route is public or when the requester is the owner.

#### Scenario: Public route read without authentication
- **WHEN** an unauthenticated request asks for a public route by id
- **THEN** the system returns the route payload

#### Scenario: Private route read by non-owner
- **WHEN** a non-owner requests a private route
- **THEN** the system denies access

### Requirement: Canonical distance calculation
The system SHALL compute and persist canonical route distance on the server from route geometry and SHALL NOT trust client-supplied distance values.

#### Scenario: Create route with client distance mismatch
- **WHEN** a client submits a route with an explicit distance that differs from geometry-derived distance
- **THEN** the system persists the server-calculated canonical distance
