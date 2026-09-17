## Why

Readers can browse published blogs and filter by tag, but they cannot search by
post title when they already know part of what they want to read. Adding title
search makes the public blog list easier to scan and supports direct discovery
without changing authoring or private draft behavior.

## What Changes

- Add public title search to the existing `GET /blogs` list endpoint with a
  query parameter for partial title matches.
- Allow title search to compose with existing pagination and tag filtering.
- Add frontend search UI on the public `/blogs` page so readers can enter a blog
  title query and see matching published posts.
- Preserve the existing blog response shape, newest-first ordering, and draft
  exclusion rules.
- Update API and architecture docs for the new query parameter and frontend
  search behavior.

## Capabilities

### New Capabilities

- `blog-title-search`: Searchable public discovery of published blogs by title
  through the existing blog list API and public blog list UI.

### Modified Capabilities

- None.

## Impact

- Backend public blog list route and backend read tests in `apps/api`.
- Frontend blog list API helper, URL/search-param handling, and public `/blogs`
  page UI in `apps/web`.
- API and architecture documentation updates in `docs/api-contract.md` and
  `docs/architecture.md`.
- No database schema changes or new dependencies are expected for the initial
  implementation because the feature filters on the existing `blogs.title`
  column.
