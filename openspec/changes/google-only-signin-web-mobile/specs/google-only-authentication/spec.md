## ADDED Requirements

### Requirement: Google Is The Only Interactive Sign-In Method
The system MUST provide Google Sign-In as the only interactive authentication method for web and mobile clients. The system MUST NOT present or accept password-based login or registration flows for end users.

#### Scenario: Web user reaches authentication screen
- **WHEN** an unauthenticated user opens the web authentication screen
- **THEN** the interface SHALL present a Google Sign-In action and SHALL NOT present email/password login or registration inputs

#### Scenario: Mobile user reaches authentication screen
- **WHEN** an unauthenticated user opens the mobile authentication screen
- **THEN** the interface SHALL present a Google Sign-In action and SHALL NOT present credential-based login or registration actions

### Requirement: Backend Exchanges Verified Google Identity Token For App Session
The backend MUST expose an authentication endpoint that accepts a Google identity token, validates token signature and claims (including issuer and audience), and issues the platform's standard application session tokens on success.

#### Scenario: Valid Google identity token
- **WHEN** the client submits a valid Google identity token to the Google auth endpoint
- **THEN** the backend SHALL create or resolve the user identity and SHALL return the standard session response containing access and refresh tokens

#### Scenario: Invalid Google identity token
- **WHEN** the client submits an invalid, expired, or audience-mismatched Google identity token
- **THEN** the backend SHALL reject the request with an authentication error and SHALL NOT issue session tokens

### Requirement: Credential Endpoints Are Removed
The backend MUST remove interactive credential endpoints used for password-based login and registration. Requests to legacy credential authentication routes MUST NOT perform sign-in.

#### Scenario: Client calls legacy login route
- **WHEN** a client calls the legacy password login route
- **THEN** the system SHALL respond as unsupported or not found and SHALL NOT authenticate the user

#### Scenario: Client calls legacy register route
- **WHEN** a client calls the legacy registration route
- **THEN** the system SHALL respond as unsupported or not found and SHALL NOT create a password-based account session

### Requirement: Session Continuity For Authorized API Access
After successful Google sign-in, the system MUST maintain existing authorized API behavior by using application access tokens for protected endpoints and refresh tokens for session renewal.

#### Scenario: Access protected route after Google sign-in
- **WHEN** a client calls a protected API with a valid app access token obtained via Google sign-in
- **THEN** the protected endpoint SHALL authorize the request using existing auth dependencies

#### Scenario: Refresh session after Google sign-in
- **WHEN** a client submits a valid app refresh token issued from a Google-based session
- **THEN** the refresh endpoint SHALL issue a new valid access token according to current token lifecycle rules
