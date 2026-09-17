## Purpose

Backend runtime schema readiness ensures deployed API containers do not serve routes whose database tables are missing because pending migrations were skipped or failed.

## ADDED Requirements

### Requirement: Container startup gates traffic on migrations
The system SHALL apply all pending backend database migrations before the API process accepts HTTP traffic in container deployments. If migrations cannot complete, the system MUST fail startup rather than serve requests against a partially migrated schema.

#### Scenario: Pending blog tag migration applies before traffic
- **WHEN** a backend container starts with pending migrations that create or repair `tags` and `blog_tags`
- **THEN** the migration upgrade completes before the container accepts successful `/health` or `/blogs` requests

#### Scenario: Migration failure blocks serving
- **WHEN** a backend container cannot complete migration upgrade after its configured retries
- **THEN** the container exits unsuccessfully and does not serve `GET /blogs`

### Requirement: Deployment configuration uses migration-ready startup
The system SHALL keep production deployment entrypoints aligned with the backend startup path that runs migrations before starting the API server.

#### Scenario: Railway deployment starts through migration runner
- **WHEN** the Railway deployment configuration is inspected
- **THEN** the configured start command invokes the backend startup script that runs migrations before Gunicorn

#### Scenario: Docker image starts through migration runner
- **WHEN** the root API Docker image command is inspected
- **THEN** the default command invokes the backend startup script that runs migrations before Gunicorn

### Requirement: Schema drift diagnosis is documented
The system SHALL document how to diagnose and recover from a deployed database that is missing migration-owned tables required by current API routes.

#### Scenario: Operator sees missing blog_tags error
- **WHEN** deployment logs report that table `blog_tags` does not exist while handling `GET /blogs`
- **THEN** the documentation identifies schema drift as the expected cause and directs the operator to verify the migration-running startup command and apply pending migrations
