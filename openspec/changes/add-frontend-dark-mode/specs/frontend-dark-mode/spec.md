## Purpose

Defines MiniBlog frontend dark mode behavior, including theme selection, persisted preference handling, accessible rendering, and compatibility with existing routes and API flows.

## ADDED Requirements

### Requirement: Users can control the frontend theme
The system SHALL provide a user-visible theme control that lets users choose light mode, dark mode, or system preference.

#### Scenario: User selects light mode
- **WHEN** a user chooses light mode
- **THEN** the frontend renders the application in the light theme regardless of the current operating system color scheme

#### Scenario: User selects dark mode
- **WHEN** a user chooses dark mode
- **THEN** the frontend renders the application in the dark theme regardless of the current operating system color scheme

#### Scenario: User selects system mode
- **WHEN** a user chooses system mode
- **THEN** the frontend renders light or dark theme according to the current operating system color scheme

### Requirement: Theme preference persists in the browser
The system SHALL persist the user's selected theme preference in browser storage and reuse it across page loads in the same browser.

#### Scenario: Persisted preference is restored
- **WHEN** a user reloads the application after selecting a theme preference
- **THEN** the frontend restores that saved light, dark, or system preference without requiring the user to choose again

#### Scenario: No preference has been saved
- **WHEN** a user visits the application without a saved theme preference
- **THEN** the frontend defaults to system preference behavior

#### Scenario: System preference changes while system mode is active
- **WHEN** the operating system color scheme changes and the saved preference is system mode or absent
- **THEN** the frontend updates the active rendered theme to match the new system preference

### Requirement: Dark mode covers all current frontend surfaces
The system SHALL render every current MiniBlog frontend route and major UI state with readable, intentional dark-mode styling.

#### Scenario: Public routes render in dark mode
- **WHEN** dark mode is active
- **THEN** the home page, public blog list, public blog detail, not-found page, and loading states use dark backgrounds, surfaces, text, borders, shadows, and accents that remain readable

#### Scenario: Auth and dashboard routes render in dark mode
- **WHEN** dark mode is active
- **THEN** login, register, dashboard, author blog list, blog creation, and blog editing screens use dark backgrounds, surfaces, form controls, buttons, loading states, empty states, and error states that remain readable

#### Scenario: Comment surfaces render in dark mode
- **WHEN** dark mode is active
- **THEN** comment list, create, edit, delete, empty, loading, validation, and action-error states use dark styling that remains readable

### Requirement: Dark mode preserves existing behavior
The system SHALL add dark mode without changing existing frontend routing, API requests, authentication behavior, or backend/database contracts.

#### Scenario: Frontend API behavior is unchanged
- **WHEN** dark mode is added
- **THEN** existing API helper paths, request bodies, response parsing, bearer-token behavior, refresh-token behavior, and error handling remain compatible with the documented API contract

#### Scenario: Backend and database behavior is unchanged
- **WHEN** dark mode is added
- **THEN** no backend endpoint, API response shape, authentication rule, database model, migration, or runtime service changes are introduced

### Requirement: Theme rendering remains accessible and stable
The system SHALL keep the active theme accessible, responsive, and stable during initial page load and interaction.

#### Scenario: Initial render uses the intended theme
- **WHEN** a page loads with a saved theme preference or system preference
- **THEN** the application applies the intended theme before normal interaction so users do not see a confusing theme switch after the page appears

#### Scenario: Interactive states remain visible
- **WHEN** a user interacts with links, buttons, form controls, disabled controls, validation messages, or destructive actions in dark mode
- **THEN** hover, focus, disabled, success, warning, and error states remain visually distinguishable

#### Scenario: Responsive layouts remain intact
- **WHEN** the frontend is viewed on mobile, tablet, and desktop widths in dark mode
- **THEN** existing layout, wrapping, spacing, and touch-target behavior remain compatible with the current light-mode experience

### Requirement: Dark mode is verified
The system SHALL include focused frontend verification for theme behavior and dark-mode coverage.

#### Scenario: Static theme checks pass
- **WHEN** frontend tests run
- **THEN** tests verify that theme preference behavior and core dark-mode coverage are represented in the frontend source

#### Scenario: Frontend quality checks pass
- **WHEN** dark mode implementation is complete
- **THEN** frontend lint, typecheck, and build verification pass or any skipped check is explicitly explained
