## ADDED Requirements

### Requirement: User registration and login
The system SHALL allow a new user to register with email and password, and SHALL allow an existing user to authenticate and obtain access and refresh tokens.

#### Scenario: Successful registration
- **WHEN** a user submits a unique email and valid password to the registration endpoint
- **THEN** the system creates the account and returns an authenticated session payload

#### Scenario: Successful login
- **WHEN** a user submits valid credentials to the login endpoint
- **THEN** the system returns a short-lived access token and a refresh token

### Requirement: Token refresh and session continuity
The system SHALL support refresh-token rotation and SHALL issue a new access token when presented with a valid, unrevoked refresh token.

#### Scenario: Valid refresh token
- **WHEN** a client submits a valid active refresh token to the refresh endpoint
- **THEN** the system issues a new access token and rotates refresh token state

#### Scenario: Reused or revoked refresh token
- **WHEN** a client submits a revoked or previously replaced refresh token
- **THEN** the system rejects the request and requires re-authentication

### Requirement: Authenticated identity endpoint
The system SHALL provide an authenticated endpoint for retrieving the currently logged-in user profile.

#### Scenario: Authenticated profile retrieval
- **WHEN** a request with a valid access token calls the identity endpoint
- **THEN** the system returns the corresponding user identity data
