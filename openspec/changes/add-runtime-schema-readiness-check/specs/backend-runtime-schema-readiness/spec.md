## Purpose

Backend runtime schema readiness prevents deployed API workers from accepting traffic when their database schema is behind the migration state required by the running code.

## ADDED Requirements

### Requirement: Production app startup verifies required schema tables
The system SHALL verify that all required migration-owned database tables exist before a production-like backend worker accepts normal API traffic. The required table set MUST include `users`, `blogs`, `comments`, `tags`, and `blog_tags`.

#### Scenario: Required tables are present
- **WHEN** a production-like backend worker starts with all required tables present in the connected database
- **THEN** the worker starts normally and can serve authenticated blog dashboard requests such as `GET /me/blogs`

#### Scenario: Blog tag association table is missing
- **WHEN** a production-like backend worker starts while the connected database is missing `blog_tags`
- **THEN** startup fails before normal API traffic is accepted
- **AND** the startup error identifies the missing required table

#### Scenario: Tag table is missing
- **WHEN** a production-like backend worker starts while the connected database is missing `tags`
- **THEN** startup fails before normal API traffic is accepted
- **AND** the startup error identifies the missing required table

### Requirement: Readiness check does not mutate schema
The runtime readiness check SHALL detect schema drift without creating, dropping, or altering database objects. Schema repair MUST continue to happen through Flask-Migrate migrations.

#### Scenario: Required table is missing
- **WHEN** the runtime readiness check finds a missing required table
- **THEN** it reports the missing table and exits without creating the table

### Requirement: Test environments can opt out of production readiness
The system SHALL allow backend tests and explicitly non-production development runs to bypass the production readiness gate so existing SQLite-backed test setup and local workflows can continue to create isolated schemas.

#### Scenario: Unit test app starts with isolated schema setup
- **WHEN** a backend unit test creates the Flask app with testing enabled
- **THEN** the app can start without connecting to a pre-migrated production database
