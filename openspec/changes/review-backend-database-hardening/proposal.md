## Why

MiniBlog's backend is clean and well-tested for current feature behavior, but the database layer is still at an early-stage shape: only email and slug indexes exist, foreign-key delete behavior is not explicit at the database level, and slug generation relies on pre-checks that can race under concurrent writes. Before the app grows more traffic or data, the backend should harden the schema, write paths, and documentation around the query patterns it already serves.

## What Changes

- Add database indexes for the existing list/read query patterns:
  - Published blog list: `blogs(status, created_at, id)`.
  - Author dashboard blog list: `blogs(author_id, created_at, id)`.
  - Blog comment list: `comments(blog_id, created_at, id)`.
- Make referential delete behavior explicit and MySQL-compatible:
  - Deleting a blog removes its comments at the database level as well as through the ORM.
  - User deletion remains restricted while authored blogs or comments exist, unless a later change intentionally designs account deletion.
- Harden blog create/update slug writes against concurrent unique-key collisions without changing the public API contract.
- Add focused backend tests for schema/index expectations, delete behavior, and duplicate-slug collision handling.
- Update `docs/database.md`, `docs/api-contract.md` only if response or error shapes change, and migration documentation as needed.
- No frontend UI redesign, no API endpoint additions, and no new runtime dependency unless implementation proves the existing SQLAlchemy/Flask-Migrate stack cannot cover the change.

## Capabilities

### New Capabilities

- `backend-database-hardening`: Backend persistence, indexing, referential integrity, and write-path resilience requirements for existing MiniBlog blog/comment/user data.

### Modified Capabilities

None. There are no existing main OpenSpec specs in this repository for backend/database behavior yet.

## Impact

- Backend models in `apps/api/app/models`.
- Backend blog write routes in `apps/api/app/routes/blogs.py`.
- Flask-Migrate migrations under `apps/api/migrations/versions`.
- Backend tests under `apps/api/tests`.
- Database documentation in `docs/database.md`.
- API contract docs only if implementation changes an externally observable response, status code, or error shape.
