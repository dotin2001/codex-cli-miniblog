## Purpose

Defines the maintained MiniBlog cross-layer map that lets maintainers trace user-facing frontend routes through API helpers, backend endpoints, authentication rules, and database persistence.

## ADDED Requirements

### Requirement: Frontend routes map to backend API contracts
The system SHALL maintain a full-stack map that lists each implemented user-facing frontend route and the backend API endpoints it depends on.

#### Scenario: Public blog route mapping is available
- **WHEN** a maintainer reviews public blog list or detail behavior
- **THEN** the map identifies the frontend route, frontend API helper, backend endpoint, auth requirement, success response shape, and primary database tables used for that behavior

#### Scenario: Authenticated dashboard mapping is available
- **WHEN** a maintainer reviews dashboard, author blog management, or protected comment actions
- **THEN** the map identifies the frontend route or component, frontend auth-session behavior, backend endpoint, bearer-token requirement, success response shape, error responses, and primary database tables used for that behavior

#### Scenario: Registration and login mapping is available
- **WHEN** a maintainer reviews authentication entry points
- **THEN** the map identifies which frontend forms call registration, login, refresh, logout, and current-user endpoints, including whether tokens or cookies are set, refreshed, cleared, or omitted

### Requirement: Database persistence is traceable from product workflows
The system SHALL describe how MiniBlog product workflows read from and write to the `users`, `blogs`, and `comments` tables.

#### Scenario: Blog workflow persistence is mapped
- **WHEN** a maintainer reviews blog create, read, update, delete, list, or author-dashboard behavior
- **THEN** the map identifies the relevant table columns, relationship constraints, uniqueness behavior, status rules, ordering, pagination, and supporting indexes

#### Scenario: Comment workflow persistence is mapped
- **WHEN** a maintainer reviews comment list, create, update, delete, or blog deletion behavior
- **THEN** the map identifies comment ownership, blog ownership, author ownership, ordering, deletion behavior, and supporting indexes

#### Scenario: Auth workflow persistence is mapped
- **WHEN** a maintainer reviews registration, login, refresh, logout, or current-user behavior
- **THEN** the map identifies stored user fields, non-persisted token state, cookie behavior, and database lookups used by each flow

### Requirement: Cross-layer drift is explicitly reviewed
The system SHALL include a repeatable review method for detecting drift between frontend code, API documentation, backend routes, and database documentation.

#### Scenario: Existing routes and helpers are covered
- **WHEN** verification runs for the full-stack map
- **THEN** implemented frontend API helpers and backend route groups are represented in the map or explicitly documented as out of scope

#### Scenario: API and database docs remain authoritative
- **WHEN** the mapping review finds a mismatch between code and documentation
- **THEN** the affected API, auth, database, or architecture documentation is updated or the mismatch is recorded as a follow-up before the map is considered complete

#### Scenario: No runtime behavior changes are introduced by mapping
- **WHEN** the full-stack map is added
- **THEN** existing endpoint paths, request bodies, response bodies, status codes, authentication requirements, database schema, and frontend UI behavior remain unchanged unless a separate implementation task explicitly documents and verifies the change

### Requirement: Verification ownership is documented
The system SHALL identify the smallest relevant verification commands for frontend, backend, database, and documentation-only portions of each mapped workflow.

#### Scenario: Backend verification is identified
- **WHEN** a mapped workflow depends on backend route, model, migration, or auth behavior
- **THEN** the map names the relevant backend unittest or migration verification command

#### Scenario: Frontend verification is identified
- **WHEN** a mapped workflow depends on frontend helpers, pages, auth-session behavior, or route helpers
- **THEN** the map names the relevant frontend test, typecheck, lint, or build verification command

#### Scenario: Documentation-only verification is identified
- **WHEN** the implementation changes only docs and static mapping tests
- **THEN** the map identifies validation steps that avoid unnecessary runtime or schema changes while still checking map coverage
