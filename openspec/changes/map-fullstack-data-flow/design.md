## Context

See `proposal.md` for motivation. MiniBlog currently has separate but related documentation for architecture, API contracts, auth flow, and database schema. The frontend uses typed helpers under `apps/web/src/lib/api`, route helpers under `apps/web/src/lib/routes.ts`, and client auth-session behavior in `apps/web/src/lib/auth-session.ts`. The backend exposes Flask Blueprints for auth, blogs, comments, current-user blog listing, and health checks. The database currently contains `users`, `blogs`, and `comments`, with blog/comment indexes and foreign-key behavior documented after the backend hardening change.

The request is review and mapping work, not a feature build. Planning and implementation should avoid changing endpoint behavior, UI design, schema, or dependencies unless the review finds real drift that must be corrected in docs or handled by a follow-up change.

## Goals / Non-Goals

**Goals:**

- Produce a durable cross-layer map that maintainers can read before changing auth, blog, comment, or database behavior.
- Ground the map in observed code paths, not only existing documentation.
- Make frontend route and API-helper ownership visible alongside backend endpoint and database ownership.
- Add low-cost coverage that catches obvious omissions when helpers or backend route registrations drift from the map.
- Preserve existing runtime behavior and use this change to document and verify alignment.

**Non-Goals:**

- No new user-facing route, page, form, endpoint, table, migration, or background job.
- No visual redesign or UX rewrite.
- No new API client abstraction, OpenAPI generator, schema validator, ORM layer, or external dependency.
- No automatic end-to-end browser/API integration harness unless a later change explicitly scopes it.
- No account deletion, token persistence, comment moderation, search, tagging, categories, or pagination redesign.

## Decisions

### Create a dedicated full-stack map document

Add a new shared doc, likely `docs/fullstack-data-flow.md`, instead of expanding `docs/architecture.md` into a very large matrix.

Rationale: `architecture.md` should stay a structural overview. A dedicated map can be denser and more operational without burying high-level project context.

Alternative considered: Put all mapping tables in `docs/api-contract.md`. That would keep endpoint details nearby, but it would mix frontend route/component ownership and database access paths into an API reference.

### Organize the map by product workflow

Group the map around auth, public blog reading, author blog management, and comments.

Rationale: Maintainers usually approach changes through product behavior. Workflow grouping lets one row connect route, helper, endpoint, auth mode, database tables, response/error shapes, and verification.

Alternative considered: Group by code directory. That is useful for inventory but weaker for understanding cross-layer effects.

### Treat existing docs as authoritative but verify against code

Use `docs/api-contract.md`, `docs/auth-flow.md`, and `docs/database.md` as inputs, then check them against frontend helpers/pages and backend routes/models.

Rationale: The map should not duplicate stale assumptions. Observed mismatches should result in targeted doc updates or explicit follow-up notes.

Alternative considered: Generate the map solely from source code. That would miss product intent and documented constraints such as token/cookie behavior and database runtime boundaries.

### Add static coverage rather than full integration automation

Add or extend lightweight static tests that verify the map mentions core frontend helpers and backend route groups.

Rationale: The current frontend already has static route/auth-session tests, and the backend suite is unittest-based. Static coverage is enough to prevent the map from becoming invisible during routine edits without adding brittle full-stack infrastructure.

Alternative considered: Add Playwright or API integration tests. That would be heavier than this mapping change and would require runtime coordination not needed for documentation coverage.

## Risks / Trade-offs

- Mapping can duplicate existing contract docs -> Keep endpoint request/response details in `docs/api-contract.md` and link or summarize them in the map.
- Static coverage can become string-fragile -> Test only stable identifiers such as helper names, endpoint paths, and doc headings.
- An active unarchived backend-hardening change may make source state look ahead of main specs -> Treat current working tree/docs as the inspected project state and avoid archiving or syncing unrelated changes in this proposal.
- Review may uncover real contract drift -> Fix small documentation drift in the apply change, but pause and propose a separate change for behavior or schema drift.

## Migration Plan

1. Create `docs/fullstack-data-flow.md` with workflow-based cross-layer tables.
2. Add a concise pointer from `docs/architecture.md` to the new map.
3. Review `docs/api-contract.md`, `docs/auth-flow.md`, and `docs/database.md` against observed frontend/backend code and update only concrete mismatches.
4. Add or update static frontend/backend tests that verify map coverage of key helpers and route groups.
5. Run OpenSpec validation, docs/static tests, and the smallest relevant frontend/backend checks.

Rollback is a normal revert of the new mapping doc, doc references, static tests, and any targeted documentation corrections. No database migration or runtime rollback should be needed because this change does not alter behavior.
