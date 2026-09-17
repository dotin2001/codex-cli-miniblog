## Why

MiniBlog posts currently cannot be grouped by topic even though the database
docs explicitly call tags unimplemented. Adding tags gives authors a lightweight
way to describe posts and gives readers a way to discover related published
blogs.

## What Changes

- Add persistent blog tags with normalized unique tag names and URL-safe tag
  slugs.
- Allow authenticated blog create and update requests to include tags.
- Return tags on blog list, blog detail, dashboard blog list, author-only blog
  detail, create, and update responses.
- Allow public blog listing to filter published posts by a tag slug while
  preserving existing pagination and draft hiding behavior.
- Add tag controls to the blog create/edit forms and display tags on public,
  dashboard, and detail blog UI surfaces.
- Update API, database, and frontend docs/tests for the new contract.

## Capabilities

### New Capabilities

- `blog-tags`: Blog tag persistence, validation, serialization, filtering, and
  frontend author/reader workflows.

### Modified Capabilities

- None.

## Impact

- Backend models, route validation/serialization, queries, migrations, and
  unittest coverage in `apps/api`.
- Frontend blog API types/helpers, create/edit forms, blog list/detail display,
  dashboard blog management display, and relevant frontend verification in
  `apps/web`.
- Shared docs in `docs/api-contract.md`, `docs/database.md`, and
  `docs/architecture.md`.
- No new runtime services or third-party dependencies are expected.
