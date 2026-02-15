## ADDED Requirements

### Requirement: Manual route drawing and editing
The system SHALL provide map-based manual drawing for route polylines, including add, move, and delete vertex interactions before save.

#### Scenario: Draw new route on map
- **WHEN** a user enters draw mode and adds points on the map canvas
- **THEN** the editor renders a route polyline preview from those points

#### Scenario: Edit existing vertex
- **WHEN** a user drags an existing route vertex
- **THEN** the editor updates the preview geometry in real time

### Requirement: Undo and redo editing actions
The system SHALL provide undo and redo for route drawing/editing actions within an active edit session.

#### Scenario: Undo last edit action
- **WHEN** a user performs an undo action after editing geometry
- **THEN** the editor restores the immediately previous geometry state

### Requirement: Marker placement and editing in map context
The system SHALL allow marker placement, repositioning, and metadata editing from the map editor interface.

#### Scenario: Add marker from map click
- **WHEN** a user clicks the map in marker mode and submits label/icon metadata
- **THEN** the editor creates a marker draft linked to the active route
