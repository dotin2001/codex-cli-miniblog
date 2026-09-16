## 1. Backend API

- [x] 1.1 Add `title` query parsing to `GET /blogs`, trim whitespace, ignore empty values, and verify `GET /blogs?title=%20%20` returns the same published list behavior as an unfiltered request.
- [x] 1.2 Apply case-insensitive literal partial matching against published blog titles while preserving newest-first ordering, and verify a mixed-case partial title request returns only matching published blogs.
- [x] 1.3 Compose title filtering with existing tag filtering and pagination totals, and verify `GET /blogs?tag=<slug>&title=<query>` plus paginated title searches count only the fully filtered result set.
- [x] 1.4 Add backend read tests in `apps/api/tests/test_blogs_read.py` for title-only search, draft exclusion, whitespace-only ignored search, tag+title composition, and filtered pagination totals; verify with `python3 -B -m unittest discover -s tests`.

## 2. Frontend Blog List

- [x] 2.1 Extend `BlogListParams` and `getBlogs()` query serialization to support `title`, and verify generated request URLs include `title` only when a non-empty value is provided.
- [x] 2.2 Update `/blogs` search-param parsing to read the `title` URL parameter alongside `tag`, pass it to `getBlogs()`, and verify direct navigation to `/blogs?title=<query>` loads matching results.
- [x] 2.3 Add a public title search form/control to `/blogs` that preserves any active tag filter, removes `title` when submitted empty, and verify form submission updates the URL as specified.
- [x] 2.4 Tailor public list headings or empty-state copy for active title searches while preserving the existing visual style, responsive behavior, dark mode, and accessibility basics; verify the no-match state clearly reflects the active title search.

## 3. Documentation

- [x] 3.1 Update `docs/api-contract.md` for `GET /blogs?title=<query>`, including trimming, case-insensitive partial title matching, composition with `tag`, pagination totals, and examples; verify the documented response shape is unchanged.
- [x] 3.2 Update `docs/architecture.md` to mention public title search on `/blogs` and `GET /blogs`, and verify it remains consistent with frontend/backend boundaries.
- [x] 3.3 Confirm `docs/database.md` still accurately states that no title-search index exists and no migration was added; update only if implementation introduces a schema change.

## 4. Verification

- [x] 4.1 Run the backend verification from `apps/api` with `python3 -B -m unittest discover -s tests` and verify all backend tests pass.
- [ ] 4.2 Run the smallest relevant frontend checks from `apps/web`, starting with `npm run lint` and `npm run typecheck`, and verify the blog list changes pass.
- [x] 4.3 Run `openspec validate add-blog-title-search --strict` and verify the proposal, spec, design, and tasks are valid.
