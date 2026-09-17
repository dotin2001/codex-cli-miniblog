## Context

See `proposal.md` for motivation. MiniBlog currently stores posts in `blogs`
and comments in `comments`; `docs/database.md` explicitly notes that tags are
not implemented. Blog routes currently validate title/excerpt/content/status,
serialize blog objects in `apps/api/app/routes/blogs.py`, and use paginated
queries for public and current-user blog lists. The frontend mirrors this
contract through `apps/web/src/lib/api/blogs.ts`, create/edit forms, public blog
list/detail pages, and dashboard blog management pages.

## Goals / Non-Goals

**Goals:**

- Add reusable tags without changing existing blog URL slugs or publication
  rules.
- Keep the blog API additive for existing clients by adding `tags` fields and
  optional `tags` request inputs.
- Keep tag filtering scoped to public published blog discovery.
- Keep implementation compatible with MySQL migrations and SQLite-backed
  backend unit tests.

**Non-Goals:**

- Separate tag management screens or endpoints.
- Tag descriptions, colors, moderation, following, or analytics.
- Filtering draft/current-user dashboard blog lists by tag.
- Changing comment behavior, auth behavior, or blog slug generation.

## Decisions

### Store reusable tags in a normalized table and connect them through a join table

Add a `tags` table with `id`, `name`, `slug`, `created_at`, and `updated_at`,
plus a `blog_tags` association table with `blog_id`, `tag_id`, and a uniqueness
constraint across both ids. `tags.slug` should be unique and indexed. Blog
deletion should cascade through `blog_tags`; tag deletion is not a user-facing
operation in this change.

Rationale: Tags are reusable across posts and need stable slugs for filtering.
A JSON or comma-separated column on `blogs` would be simpler initially, but it
would make tag reuse, uniqueness, filtering, and indexing weaker.

### Use tag names in write requests and tag objects in responses

Create/update requests should accept `tags?: string[]`; responses should return
`tags: [{ id, name, slug }]`. The backend should trim names, reject invalid
values, enforce a 40-character name limit and 10-tag-per-blog limit, normalize
equivalent names to one tag, and generate slugs from names. Equivalent names
should match by normalized slug so `Python` and ` python ` refer to one tag.

Rationale: Authors think in names, readers and links need slugs. Returning tag
objects avoids clients re-implementing slug logic. An endpoint that requires tag
ids would force pre-creating tags and add workflow complexity not needed here.

### Replace all tags only when update payload includes `tags`

`PATCH /blogs/:slug` should leave tags unchanged when `tags` is omitted. When
`tags` is present, it should replace the blog's tag associations with the
validated distinct tag set.

Rationale: This matches current partial-update semantics for existing optional
fields and lets clients update content without resubmitting tags. Incremental
tag add/remove operations would need extra endpoint semantics without improving
the current form workflow.

### Add public tag filtering to the existing blog list endpoint

Use `GET /blogs?tag=<tag-slug>` for public filtering. Unknown tags should return
an empty successful list with zero totals. Filtering must continue to include
only published blogs and preserve existing `page`, `perPage`, and pagination
shape.

Rationale: The public list already owns published blog discovery and pagination.
A separate `/tags/:slug/blogs` endpoint would duplicate list behavior and expand
the API surface unnecessarily.

### Update frontend surfaces without adding libraries

Extend `Blog`, `CreateBlogPayload`, `UpdateBlogPayload`, and `BlogListParams` in
the existing API helper. Add a simple tag input to create/edit forms that parses
comma-separated names into a string array. Display tags as compact links on
public blog cards/detail and as labels on dashboard blog rows. Preserve the
existing visual system and route helpers.

Rationale: The current forms are lightweight, local state is sufficient, and a
dependency for tag input would be out of proportion for this feature.

## Risks / Trade-offs

- Tag slug collisions from different punctuation or casing -> Normalize through
  one backend helper and enforce a unique database constraint.
- N+1 queries when serializing tags for blog lists -> Eager-load blog tags in
  list/detail queries before serialization.
- Existing clients may not send `tags` -> Treat request tags as optional and
  response tags as additive.
- SQLite tests and MySQL migrations can drift -> Keep model definitions
  vendor-neutral and verify with backend unit tests; verify migration upgrade
  when a database is available.
- Orphaned unused tags can accumulate -> Accept for this feature; cleanup can be
  a later maintenance task if needed.

## Migration Plan

1. Add the tag model and blog-tag association table in SQLAlchemy.
2. Generate a Flask-Migrate migration that creates `tags` and `blog_tags` with
   unique/index constraints and cascade behavior.
3. Update blog route validation, tag lookup/creation, serialization, and public
   filtering.
4. Update frontend API helpers, forms, displays, and tag-filtered list handling.
5. Update `docs/api-contract.md`, `docs/database.md`, and
   `docs/architecture.md`.
6. Run backend unit tests and the smallest relevant frontend checks.

Rollback is straightforward before users create tags: downgrade the migration
and revert code. After tags exist, rollback would drop tag data, so production
rollback should first export or accept loss of tag associations.
