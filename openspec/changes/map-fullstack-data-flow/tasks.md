## 1. Source Review and Map Draft

- [x] 1.1 Inventory frontend user-facing routes, API helpers, auth-session helper behavior, and route helper usage, and verify the inventory covers `apps/web/src/app`, `apps/web/src/lib/api`, `apps/web/src/lib/auth-session.ts`, and `apps/web/src/lib/routes.ts`.
- [x] 1.2 Inventory backend Blueprints, endpoint paths, auth requirements, serializers, error envelopes, and route-to-model usage, and verify the inventory covers `apps/api/app/routes`, `apps/api/app/models`, and current backend tests.
- [x] 1.3 Inventory database persistence behavior for `users`, `blogs`, and `comments`, including relationships, indexes, slug uniqueness, status rules, token persistence boundaries, and delete behavior, and verify the inventory matches `docs/database.md` plus model metadata.

## 2. Documentation Implementation

- [x] 2.1 Create `docs/fullstack-data-flow.md` organized by auth, public blog reads, author blog management, and comments, and verify each workflow row maps frontend route/component, frontend helper, backend endpoint, auth mode, response/error shape, database tables/indexes, and verification owner.
- [x] 2.2 Add a concise reference from `docs/architecture.md` to the full-stack data-flow map, and verify the architecture overview remains high-level without duplicating the full matrix.
- [x] 2.3 Review `docs/api-contract.md`, `docs/auth-flow.md`, and `docs/database.md` against the completed map, and verify any concrete doc drift is corrected or recorded as a follow-up without changing runtime behavior.

## 3. Static Coverage

- [x] 3.1 Add or extend a frontend static test that verifies core API helpers, route helpers, and auth-session behavior are represented in `docs/fullstack-data-flow.md`, and verify `cd apps/web && npm run test` passes.
- [x] 3.2 Add a backend static or unittest check that verifies core backend route groups, endpoint paths, and table names are represented in `docs/fullstack-data-flow.md`, and verify `cd apps/api && python3 -B -m unittest discover -s tests` passes.
- [x] 3.3 Verify the map covers `BLOG_SLUG_CONFLICT`, refresh-token cookie behavior, draft vs published blog visibility, author-only mutations, and comment cascade/delete behavior by reviewing the generated map against current docs and code.

## 4. Final Validation

- [x] 4.1 Run `openspec validate map-fullstack-data-flow --strict` and verify the change artifacts are valid.
- [x] 4.2 Run `git diff --check` and verify the implementation diff is limited to docs, mapping tests, and any targeted documentation corrections.
- [x] 4.3 Summarize any discovered frontend/backend/database gaps that require a separate implementation proposal, and verify no schema migration, endpoint contract change, or UI redesign was silently introduced by this mapping change.
