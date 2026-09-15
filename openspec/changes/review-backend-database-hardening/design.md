## Context

See `proposal.md` for motivation and scope. The current backend already has a clear Flask app factory, route Blueprints, SQLAlchemy models, Flask-Migrate migrations, and a broad unittest suite using in-memory SQLite. The review found:

- `users.email` and `blogs.slug` are indexed and unique where expected.
- Public and dashboard blog list queries filter by `blogs.status` or `blogs.author_id`, sort by `created_at DESC, id DESC`, and paginate with offset/limit.
- Comment list queries filter by `comments.blog_id` and sort by `created_at ASC, id ASC`.
- `comments.blog_id` and `comments.author_id` foreign keys exist, but database-level `ON DELETE` behavior is not explicit.
- The ORM cascades blog deletion to comments, but direct database behavior and migration documentation do not yet express that guarantee.
- Blog slug generation checks for existing slugs before commit, but create/update writes do not retry on a late unique-key collision.
- Existing API contracts should remain stable unless implementation finds a reason to surface a documented conflict response.

## Goals / Non-Goals

**Goals:**

- Harden persistence for the query patterns MiniBlog already uses.
- Keep schema changes MySQL-compatible while preserving SQLite-based tests where practical.
- Make database integrity behavior explicit in models, migrations, docs, and tests.
- Add minimal route-level resilience for duplicate slug races.
- Keep docs synchronized with actual schema behavior.

**Non-Goals:**

- No account-deletion feature or user data-retention policy.
- No database-backed refresh token/session table.
- No full service-layer rewrite.
- No pagination redesign, cursor pagination, search, tags, likes, categories, or moderation workflow.
- No new backend framework, ORM, migration tool, or database vendor.

## Decisions

### Add composite indexes for current list patterns

Add indexes that match the filters and orderings already present in routes:

- `blogs(status, created_at, id)` for `GET /blogs`.
- `blogs(author_id, created_at, id)` for `GET /me/blogs`.
- `comments(blog_id, created_at, id)` for `GET /blogs/<slug>/comments`.

Rationale: `docs/database.md` already identifies these as high-value candidates, and the route code confirms the query patterns. This keeps the improvement tied to observed behavior instead of speculative tuning.

Alternative considered: wait for measured production traffic before adding indexes. That is reasonable for some systems, but MiniBlog already documents these exact candidates and the tables are small/simple enough that the added write overhead is modest.

### Keep user deletes restricted, cascade only blog-to-comments

Set or preserve restrictive behavior for `blogs.author_id` and `comments.author_id`, and make `comments.blog_id` cascade on blog delete.

Rationale: deleting a blog should not leave orphaned comments, and the app already treats comments as children of a blog. User/account deletion has broader product and privacy implications and should not be implied by this hardening change.

Alternative considered: cascade user deletion to all authored blogs/comments. That would create product behavior not currently designed and could surprise users or administrators.

### Use migration plus model metadata changes together

Update SQLAlchemy model foreign keys/index declarations and create a Flask-Migrate migration that applies matching database changes.

Rationale: model metadata keeps `db.create_all()` test schemas aligned, while migrations keep real MySQL environments aligned. Updating only one side would leave either tests or runtime schema misleading.

Alternative considered: migration-only indexes and constraints. That avoids model noise but lets SQLite test schemas drift from documented behavior.

### Handle slug races with bounded retry around commits

Wrap blog create and title-update commits that assign slugs with `IntegrityError` handling. On a slug unique-key collision, roll back, choose the next available slug, and retry a small bounded number of times. Preserve existing response shapes when retry succeeds.

Rationale: the current `_unique_slug()` pre-check works for normal usage, but two requests can choose the same slug before either commits. Bounded retry keeps the current API behavior while avoiding generic `500` responses for a known race.

Alternative considered: return `409 Conflict` whenever the commit fails. That is simpler but pushes an avoidable internal slug allocation race to clients.

### Keep tests focused and mostly SQLite-compatible

Add tests for:

- SQLAlchemy metadata index definitions.
- ORM/database delete behavior available through `db.create_all()` test schemas.
- Blog create/update collision handling by simulating an `IntegrityError` path or pre-seeding conflicting slugs around route calls.
- Existing endpoint behavior remaining stable.

Rationale: the current suite uses in-memory SQLite heavily and should stay fast. MySQL-specific migration verification belongs in the migration/runtime verification step when a database is available.

Alternative considered: require MySQL integration tests for every schema behavior. That would increase confidence but also raise local setup cost; it can be added later if this project starts running database-backed CI.

## Risks / Trade-offs

- Indexes add write overhead -> Keep only indexes tied to current route queries and document them as current schema.
- Changing foreign-key `ON DELETE` behavior on existing tables can vary by database engine -> Review the generated Alembic migration and use MySQL-compatible constraint drop/create operations.
- SQLite may not enforce or alter constraints exactly like MySQL -> Keep tests focused on model metadata and application-visible behavior, and verify migration upgrade against MySQL when available.
- Slug retry logic can loop if every candidate is taken -> Use a bounded retry and return a documented conflict/server-safe error if exhausted.
- Existing dirty OpenSpec/doc work can make diffs noisy -> Keep implementation scoped to backend/database files for this change.

## Migration Plan

1. Update model metadata for indexes and foreign-key delete behavior.
2. Create and review a Flask-Migrate migration that adds composite indexes and updates the `comments.blog_id` foreign key delete action.
3. Update blog create/update slug commit handling with bounded retry for unique slug collisions.
4. Add or update backend tests for indexes, delete behavior, slug collision handling, and unchanged endpoint response contracts.
5. Update `docs/database.md` to list current indexes and foreign-key delete behavior.
6. Update `docs/api-contract.md` only if implementation introduces a new documented conflict/error response.
7. Run backend unittest discovery.
8. Run `flask --app app db upgrade` against MySQL when a database is available; otherwise document that migration runtime verification was skipped.

Rollback is a normal migration downgrade for added indexes/constraint changes plus reverting the route/model/test/doc edits. If a production-like database already contains large tables, confirm the index creation strategy before applying the migration during peak traffic.
