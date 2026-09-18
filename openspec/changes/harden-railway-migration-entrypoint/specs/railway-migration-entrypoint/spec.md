## Purpose

Railway migration entrypoint readiness ensures API containers apply pending database migrations before Gunicorn can serve traffic, even when deployment command configuration drifts.

## ADDED Requirements

### Requirement: Container startup cannot bypass migration runner through command override
Repository-managed Railway and Docker API containers SHALL run the backend migration startup path before Gunicorn accepts traffic. If a platform command would otherwise start Gunicorn directly, the container startup behavior MUST still run pending migrations first or fail before serving traffic.

#### Scenario: Platform command starts Gunicorn directly
- **WHEN** a Railway or Docker deployment supplies a command that would otherwise invoke Gunicorn directly
- **THEN** the backend migration startup path runs before Gunicorn workers serve requests

#### Scenario: Pending tag migrations exist
- **WHEN** the connected database is missing `tags` or `blog_tags` and pending migrations can apply successfully
- **THEN** startup applies the migrations before Gunicorn serves authenticated dashboard routes such as `GET /me/blogs`

### Requirement: Migration startup remains fail-closed
The deployment startup path SHALL refuse to start Gunicorn when migration upgrade fails after its configured retry attempts.

#### Scenario: Migration upgrade cannot complete
- **WHEN** the backend cannot complete migration upgrade after its configured retries
- **THEN** the API process exits unsuccessfully before Gunicorn serves traffic

### Requirement: Startup logs distinguish migration and readiness states
The backend deployment logs SHALL make it clear whether migrations ran, migrations failed, or schema readiness blocked startup after migration attempts.

#### Scenario: Healthy startup
- **WHEN** migrations complete and required schema tables are present
- **THEN** logs include migration startup and success messages before Gunicorn worker startup messages

#### Scenario: Readiness blocks startup
- **WHEN** migrations do not leave the database with required schema tables
- **THEN** logs identify the missing tables before the API serves traffic

### Requirement: Railway recovery guidance covers command drift
The project documentation SHALL explain how to recover when Railway logs show Gunicorn starting without migration startup messages.

#### Scenario: Operator sees Gunicorn without migration logs
- **WHEN** Railway logs include Gunicorn startup but omit migration startup messages
- **THEN** documentation directs the operator to clear or correct platform Start Command overrides, redeploy the current image, and run a one-off migration command only when the connected database still needs repair
