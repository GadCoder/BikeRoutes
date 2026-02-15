## ADDED Requirements

### Requirement: Public route listing
The system SHALL provide a paginated listing endpoint for public routes and SHALL include the authenticated user's own routes when authenticated.

#### Scenario: Unauthenticated listing request
- **WHEN** an unauthenticated client requests the route list
- **THEN** the response contains only public routes

#### Scenario: Authenticated listing request
- **WHEN** an authenticated client requests the route list
- **THEN** the response contains public routes plus routes owned by that user

### Requirement: Route list filtering and sorting
The system SHALL support query, bounding-box filtering, and sort controls for route discovery.

#### Scenario: Bounding box filter
- **WHEN** a client requests public routes with a valid bbox parameter
- **THEN** the system returns routes intersecting that spatial bounds filter

#### Scenario: Sorted discovery list
- **WHEN** a client requests sort and order parameters
- **THEN** the system returns results in the requested stable order
