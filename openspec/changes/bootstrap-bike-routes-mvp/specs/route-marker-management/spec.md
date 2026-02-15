## ADDED Requirements

### Requirement: Marker CRUD per route
The system SHALL allow authenticated owners to create, update, and delete markers on their own routes.

#### Scenario: Add marker to owned route
- **WHEN** an owner submits a marker with valid point geometry for a route they own
- **THEN** the system persists the marker on that route

#### Scenario: Non-owner marker update attempt
- **WHEN** a non-owner attempts to modify a marker on another user's route
- **THEN** the system denies the operation

### Requirement: Marker ordering consistency
The system SHALL maintain stable marker ordering per route using a unique order index within each route.

#### Scenario: Duplicate order index on same route
- **WHEN** a marker is created or updated with an order index already used on that route
- **THEN** the system rejects the request or requires conflict resolution

### Requirement: Marker visibility on route reads
The system SHALL include route markers in route retrieval responses when the requester is authorized to view the route.

#### Scenario: Authorized route fetch includes markers
- **WHEN** an authorized client fetches a route
- **THEN** the response includes marker features associated with that route
