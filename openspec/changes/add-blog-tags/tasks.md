## 1. Backend Schema

- [x] 1.1 Add a `Tag` model, blog-tag association table, blog/tag relationships, and model exports; verify `db.create_all()` succeeds in the existing SQLite-backed backend test setup.
- [x] 1.2 Add a Flask-Migrate migration for `tags` and `blog_tags` with unique/index constraints and cascade behavior; verify the migration file is present under `apps/api/migrations/versions` and matches the model schema.

## 2. Backend API Behavior

- [x] 2.1 Add shared tag normalization and validation for optional `tags` arrays; verify backend tests cover trimming, de-duplication, blank values, non-string values, overlong names, and the 10-tag limit.
- [x] 2.2 Update `POST /blogs` to create/reuse tags and associate them with new blogs; verify create-blog tests cover tagged creation, tag reuse, empty tags, and invalid tag errors.
- [x] 2.3 Update `PATCH /blogs/:slug` to replace tags only when `tags` is present and preserve tags when omitted; verify update-blog tests cover replacement, omitted tags, and invalid tag rollback.
- [x] 2.4 Update blog serializers and eager loading so all blog responses include `tags`; verify read, create, update, dashboard list, and author-only detail tests assert tag objects and empty tag arrays.
- [x] 2.5 Add `GET /blogs?tag=<slug>` filtering for published posts; verify read tests cover matching published posts, unknown tags returning empty pagination, and draft exclusion.

## 3. Frontend API And UI

- [x] 3.1 Extend blog API types/helpers for `BlogTag`, `Blog.tags`, request `tags`, and list `tag` query params; verify `npm run typecheck` accepts the updated contracts.
- [x] 3.2 Add tag input parsing and field-error display to create and edit blog forms; verify form payload construction sends tag arrays and preserves existing submit flows.
- [x] 3.3 Display tags on public blog cards, public blog detail pages, and dashboard blog management views; verify the rendered UI handles both tagged and untagged blogs without layout overlap.
- [x] 3.4 Support tag-filtered public blog list URLs from displayed tag links; verify selecting a public tag navigates to `/blogs?tag=<slug>` and the page passes the tag to `getBlogs`.

## 4. Documentation

- [x] 4.1 Update `docs/api-contract.md` for request `tags`, response `tags`, validation errors, and `GET /blogs?tag=` behavior; verify examples match the implemented JSON shape.
- [x] 4.2 Update `docs/database.md` for `tags`, `blog_tags`, relationships, indexes, and delete behavior; verify the document no longer states that tags are unimplemented.
- [x] 4.3 Update `docs/architecture.md` for tag-aware blog routes and frontend surfaces; verify documented routes still match the implementation.

## 5. Verification

- [x] 5.1 Run `python3 -B -m unittest discover -s tests` from `apps/api`; verify all backend tests pass.
- [x] 5.2 Run the smallest relevant frontend checks from `apps/web` (`npm run typecheck` plus lint/build if touched UI warrants it); verify checks pass or document any environment blocker.
- [x] 5.3 If a MySQL database is available, run `flask --app app db upgrade` from `apps/api`; verify migrations apply cleanly or document why database verification was skipped.
