## 1. Schema and Model Hardening

- [x] 1.1 Add model metadata for the current query-pattern indexes on `Blog` and `Comment`, and verify SQLAlchemy metadata exposes indexes for `blogs(status, created_at, id)`, `blogs(author_id, created_at, id)`, and `comments(blog_id, created_at, id)`.
- [x] 1.2 Update model foreign keys so `comments.blog_id` cascades on blog delete while user-authored blog/comment foreign keys remain restrictive, and verify model metadata reflects the intended delete behavior.
- [x] 1.3 Create a Flask-Migrate migration that adds the composite indexes and updates the `comments.blog_id` foreign key behavior, and verify the migration has safe upgrade and downgrade operations.

## 2. Slug Write Resilience

- [x] 2.1 Add bounded `IntegrityError` handling for blog creation slug collisions, and verify a simulated late duplicate slug collision retries to the next available slug without returning an unhandled server error.
- [x] 2.2 Add bounded `IntegrityError` handling for blog title-update slug collisions, and verify a simulated late duplicate slug collision either retries to a unique slug or returns a documented conflict response.
- [x] 2.3 Preserve existing successful blog create/update response shapes, and verify the current blog create/update endpoint tests still pass.

## 3. Tests

- [x] 3.1 Add focused backend tests for composite index metadata and foreign-key delete behavior, and verify the new tests pass under the existing in-memory SQLite test setup where supported.
- [x] 3.2 Add focused backend tests for duplicate slug collision handling on create and update, and verify they fail against the pre-change behavior and pass after implementation.
- [x] 3.3 Run the full backend unittest suite with `cd apps/api && python3 -B -m unittest discover -s tests`, and verify all backend tests pass.

## 4. Documentation and Migration Verification

- [x] 4.1 Update `docs/database.md` to list the new current indexes and active foreign-key delete behavior, and verify the docs no longer describe those indexes as future candidates.
- [x] 4.2 Update `docs/api-contract.md` only if implementation introduces a new conflict/error response, and verify any new response shape includes status code, error envelope, and triggering condition.
- [x] 4.3 Run `git diff --check` and review the final backend/database diff, verifying no frontend files or unrelated runtime behavior changed.
- [x] 4.4 When MySQL is available, run `cd apps/api && flask --app app db upgrade` against the documented local database and verify the migration applies; if MySQL is unavailable, document the skipped migration runtime verification.
