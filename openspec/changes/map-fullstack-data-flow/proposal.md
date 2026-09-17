## Why

MiniBlog now has enough auth, blog, comment, and database behavior that future changes need a durable map of how frontend routes, API helpers, backend endpoints, and tables fit together. The current docs describe each layer, but they do not provide an auditable cross-layer contract that reviewers can use to spot frontend/backend/database drift.

## What Changes

- Add a full-stack data-flow map covering authentication, public blog reads, author blog management, and comments.
- Review frontend route and API-helper usage against backend routes, documented API responses, auth requirements, and database tables.
- Document the mapping in shared project docs without changing runtime behavior.
- Add lightweight static verification that important frontend API helper calls and backend route registrations remain represented in the map.
- Identify any observed contract gaps or stale documentation during implementation and update only the affected docs.
- No frontend redesign, no backend endpoint additions, no schema changes, and no new runtime dependencies unless the review proves they are necessary and a follow-up change is proposed.

## Capabilities

### New Capabilities

- `fullstack-data-flow-map`: Defines requirements for a maintained MiniBlog cross-layer map from frontend routes and helpers to backend endpoints, auth modes, response shapes, database tables, indexes, and verification ownership.

### Modified Capabilities

None. There are no archived main OpenSpec specs in this repository for full-stack mapping yet.

## Impact

- Shared docs under `docs/`, likely a new full-stack mapping document plus small references from `docs/architecture.md`.
- Frontend API helper and route files under `apps/web/src/lib` and relevant page/client components for review and possible static tests.
- Backend route, model, migration, and test files under `apps/api` for review and possible static tests.
- Existing API, auth, and database docs as source inputs; update them only if the mapping review finds concrete drift.
- OpenSpec artifacts only during this proposal workflow; implementation waits for `$openspec-apply-change map-fullstack-data-flow`.
