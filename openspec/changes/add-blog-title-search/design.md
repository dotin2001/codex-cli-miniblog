## Context

The public blog list currently lives on `GET /blogs` and supports pagination plus
optional tag filtering with `tag=<tag-slug>`. The route returns published blogs
only, orders by `created_at desc, id desc`, and includes author and tag data.
The frontend `/blogs` page reads the `tag` search parameter, calls
`getBlogs()`, and renders the first page of results.

The `blogs.title` column already exists and is required. The current schema has
indexes for published list ordering and slug lookups, but no title-search index.

## Goals / Non-Goals

**Goals:**

- Add title filtering without introducing a new endpoint or changing the blog
  response shape.
- Keep title search compatible with existing tag filtering and pagination.
- Keep the URL as the source of truth for public blog list filters so searches
  are shareable and reload-safe.
- Keep the first implementation dependency-free and migration-free.

**Non-Goals:**

- Full-text search, relevance ranking, fuzzy matching, or searching blog content.
- Searching draft/private blogs or dashboard-owned blog lists.
- Adding database indexes before the app has measured title-search performance
  pressure.

## Decisions

- Use `GET /blogs?title=<query>` for title search.
  - Rationale: `title` names the exact field being searched and avoids
    over-promising broader search behavior.
  - Alternative considered: `q=<query>`, but that reads as global search and
    would make future content/tag/author search semantics ambiguous.

- Implement title filtering inside the existing public blog list query.
  - Rationale: This preserves pagination, ordering, response shape, CORS/auth
    behavior, and the existing frontend API helper path.
  - Alternative considered: Add a dedicated search endpoint, but the current
    feature is a list filter rather than a separate search domain.

- Trim the title query and ignore it when empty.
  - Rationale: Whitespace-only input should not produce surprising empty results
    or validation errors on a public browse page.
  - Alternative considered: Return `400` for blank title searches, but existing
    list filters are permissive and public browsing should remain forgiving.

- Use case-insensitive partial matching over `Blog.title`.
  - Rationale: Readers expect title search to find natural text fragments without
    exact casing. The implementation should use SQLAlchemy query composition and
    remain compatible with both MySQL runtime and SQLite tests.
  - Alternative considered: Case-sensitive matching, but that is a weaker user
    experience for public discovery.

- Store the frontend search state in the `title` URL parameter.
  - Rationale: URL-driven state already matches the App Router page model and
    keeps search results shareable.
  - Alternative considered: Client-only state, but it would not survive reloads
    or align with the server-rendered blog list.

## Risks / Trade-offs

- Unindexed `LIKE` title filtering may become slow on large datasets ->
  Mitigation: keep the initial feature migration-free, document no schema change,
  and add a measured index or full-text capability later if production data
  requires it.
- SQL wildcard characters in user input could behave like pattern operators if
  passed directly to `LIKE` -> Mitigation: escape wildcard characters or use a
  SQLAlchemy helper that supports literal containment semantics.
- UI filter combinations can become unclear as tag and title filters compose ->
  Mitigation: show the active query in the search input, preserve active tag
  links, and tailor the empty state when a title search is active.
- Updating public API behavior without docs can drift from frontend assumptions
  -> Mitigation: update `docs/api-contract.md` and `docs/architecture.md` in the
  same implementation change.

## Migration Plan

No database migration is expected. Deploy the backend filter and frontend URL/UI
support together, then update docs and tests. Rollback can remove the frontend
search control and backend `title` query handling; existing `/blogs`, tag
filtering, pagination, and blog detail behavior remain compatible.
