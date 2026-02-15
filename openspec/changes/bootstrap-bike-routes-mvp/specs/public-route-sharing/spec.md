## ADDED Requirements

### Requirement: Public/private route visibility control
The system SHALL allow route owners to mark routes as public or private and SHALL enforce visibility accordingly.

#### Scenario: Owner enables public visibility
- **WHEN** an owner updates a route to public visibility
- **THEN** the route becomes accessible to unauthenticated viewers via public endpoints

#### Scenario: Owner sets route to private
- **WHEN** an owner updates a route to private visibility
- **THEN** non-owner public access to that route is denied

### Requirement: Share token access
The system SHALL issue a share token for shareable routes and SHALL resolve route access using that token endpoint.

#### Scenario: Valid share token lookup
- **WHEN** a client requests a route using a valid share token
- **THEN** the system returns the associated route payload

#### Scenario: Invalid share token lookup
- **WHEN** a client requests a route using an unknown share token
- **THEN** the system returns a not-found response
