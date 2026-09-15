## Why

MiniBlog's frontend is currently light-only even though the app has expanded into a multi-page reading and authoring experience. Adding dark mode improves reading comfort, accessibility preference support, and visual polish without changing backend or database behavior.

## What Changes

- Add frontend dark mode support across public pages, auth screens, dashboard screens, blog CRUD forms, comment UI, loading states, empty states, and error states.
- Add a user-visible theme control that lets users choose light, dark, or system preference, with the choice persisted in browser storage.
- Configure Tailwind for dark-mode variants and update global color-scheme behavior.
- Preserve the existing MiniBlog visual identity, layout, responsive behavior, auth/session behavior, and API contracts.
- Add focused frontend tests or static checks for theme preference behavior and dark-mode styling coverage.
- No backend endpoint, API contract, database schema, dependency, or runtime service changes are expected.

## Capabilities

### New Capabilities

- `frontend-dark-mode`: Defines requirements for MiniBlog's frontend theme preference, dark-mode rendering, persistence, accessibility, and verification.

### Modified Capabilities

None. There are no archived main OpenSpec specs in this repository for frontend theming yet.

## Impact

- Frontend Tailwind configuration in `apps/web/tailwind.config.ts`.
- Frontend global styles and root layout in `apps/web/src/app/globals.css` and `apps/web/src/app/layout.tsx`.
- A small frontend theme helper/provider/control, likely under `apps/web/src/lib` and/or `apps/web/src/components`.
- Existing frontend pages/components under `apps/web/src/app` and `apps/web/src/components/auth-panel.tsx`.
- Frontend tests under `apps/web/tests`.
- Shared docs only if implementation introduces durable theme behavior that should be documented.
