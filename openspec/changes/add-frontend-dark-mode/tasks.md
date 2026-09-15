## 1. Theme Infrastructure

- [x] 1.1 Configure Tailwind class-based dark mode in `apps/web/tailwind.config.ts` and verify the config exposes `darkMode: "class"`.
- [x] 1.2 Update `apps/web/src/app/globals.css` and root layout bootstrap behavior for light/dark color-scheme and pre-hydration class application, and verify saved or system preferences apply before normal interaction.
- [x] 1.3 Add a frontend theme preference helper/provider/control for `light`, `dark`, and `system` with localStorage persistence, and verify invalid or missing preferences fall back to system mode.

## 2. Surface Styling

- [x] 2.1 Apply dark-mode styling to home, login, register, dashboard, public blog list/detail, not-found, and loading pages, and verify mobile, tablet, and desktop layouts preserve the existing structure.
- [x] 2.2 Apply dark-mode styling to auth panels, dashboard blog list cards, create/edit blog forms, owner actions, and comment components, and verify form controls, cards, empty states, and loading states remain readable.
- [x] 2.3 Apply dark-mode styling to validation, unauthorized, not-found, destructive, warning, success, and generic error states, and verify hover, focus, disabled, and active states remain distinguishable.
- [x] 2.4 Update relevant frontend or project documentation if durable theme behavior needs to be recorded, and verify no API, auth, database, migration, or backend docs are changed unless a contract change is intentionally introduced.

## 3. Verification and Coverage

- [x] 3.1 Add or update frontend static tests for the theme storage key, allowed preference values, system fallback behavior, Tailwind dark-mode configuration, and representative `dark:` coverage, and verify `cd apps/web && npm run test` passes.
- [x] 3.2 Run `cd apps/web && npm run lint` and verify the dark-mode UI changes keep lint clean.
- [x] 3.3 Run `cd apps/web && npm run typecheck` and verify theme helper, provider, and control types compile.
- [x] 3.4 Run `cd apps/web && npm run build` and verify App Router rendering and the pre-hydration theme script build successfully.
- [x] 3.5 Run local visual verification for representative pages in light, dark, and system modes on mobile and desktop widths, and verify no unreadable text, broken contrast, or incoherent overlap is present.
- [x] 3.6 Review the final implementation diff and verify no backend files, API contracts, database schema, migrations, or runtime service files changed.
