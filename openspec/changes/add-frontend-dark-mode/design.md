## Context

See `proposal.md` for motivation. The current frontend is explicitly light-only: `globals.css` sets `color-scheme: light`, `tailwind.config.ts` does not configure dark mode, and pages/components use direct light palette utilities such as `bg-white`, `text-slate-950`, `border-purple-100`, and light gradient backgrounds. The app is a plain Next.js App Router frontend with React, TypeScript, and Tailwind CSS 3, with no component library or theme dependency.

This change is frontend-only. API helpers, auth-session behavior, backend routes, and database persistence should remain untouched except for verification that no contract changes were introduced.

## Goals / Non-Goals

**Goals:**

- Add a stable light/dark/system theme model.
- Preserve MiniBlog's current layout, page structure, route helper usage, auth-session behavior, and API helper behavior.
- Keep the implementation dependency-free and Tailwind-first.
- Apply dark-mode styles across every current page, form, card, loading state, empty state, and error state.
- Make the theme control easy to find on public, auth, and dashboard surfaces without creating a redesign.
- Verify behavior through existing frontend checks and focused static tests.

**Non-Goals:**

- No backend, API contract, auth, database, Docker, or migration changes.
- No broad visual redesign, content rewrite, or layout replacement.
- No new UI kit, theme library, icon package, CSS-in-JS package, or form library.
- No user-account-backed theme persistence.
- No multi-theme palette system beyond light, dark, and system.

## Decisions

### Use Tailwind class-based dark mode

Configure Tailwind with `darkMode: "class"` and apply the active theme by toggling a `dark` class on the document element.

Rationale: Class-based dark mode supports explicit user choice, does not depend only on media queries, and fits Tailwind CSS 3 without new dependencies.

Alternative considered: Use `media` dark mode only. That would support OS preference but would not let users choose light or dark independently.

### Persist theme preference in localStorage

Store a small browser-only preference such as `light`, `dark`, or `system` in localStorage. The default is system mode when no value is present.

Rationale: The current frontend already uses localStorage for development access-token state, and this preference is not sensitive. Browser-local storage avoids backend/account changes.

Alternative considered: Store theme preference in the database. That would require auth/profile API and schema work beyond a frontend dark-mode change.

### Apply theme before hydration with a small bootstrap script

Add an inline pre-hydration script in the root layout that reads the stored preference and system setting, then sets the document class and color scheme before the app renders.

Rationale: Without an early script, users may see a visible light-to-dark switch on first load. The script can be small, deterministic, and dependency-free.

Alternative considered: Apply theme only from a client component after hydration. That is simpler but creates a flash risk and does not meet the initial-render requirement.

### Provide a reusable theme control

Add a small client component for the light/dark/system control and place it in common page headers or a shared header pattern where practical.

Rationale: The app currently duplicates header markup across pages. A single control can be reused without forcing a full header refactor.

Alternative considered: Refactor every page header into one shared layout component first. That may be useful later, but it is not required for dark mode and would increase blast radius.

### Use Tailwind variants and small shared constants where helpful

Add `dark:` classes directly to existing component class strings, extracting small class constants only when repeated patterns become hard to review.

Rationale: The current codebase uses inline Tailwind classes rather than a variant library. Keeping that style preserves local conventions while allowing limited cleanup.

Alternative considered: Introduce a class composition helper or variant system. That would add dependency or abstraction weight for a contained styling change.

## Risks / Trade-offs

- Large number of repeated light classes can make edits noisy -> Keep changes scoped by route/component and extract tiny shared class constants only where repetition is already local.
- Initial theme script can conflict with hydration if state disagrees -> Use the same storage key and resolution algorithm in both bootstrap script and client theme helper.
- Dark palettes can become too monochrome -> Use balanced neutral surfaces with restrained purple accents, visible status colors, and clear destructive/error colors.
- Some pages have server components and client components mixed -> Keep browser storage and media-query logic inside client-only helpers or inline bootstrap code, while server components only render reusable controls where allowed.
- Static tests may become brittle if they assert arbitrary class names -> Prefer stable checks for theme helper behavior, storage key, Tailwind dark-mode configuration, and representative dark variants.

## Migration Plan

1. Configure Tailwind for class-based dark mode and update global color-scheme defaults.
2. Add a small theme preference helper and reusable theme control.
3. Add the pre-hydration bootstrap script in the root layout.
4. Apply dark-mode styling across all current frontend pages, components, loading states, forms, empty states, and error states.
5. Add focused frontend tests/static checks for theme preference behavior and representative dark-mode coverage.
6. Run frontend test, lint, typecheck, and build checks.

Rollback is a normal revert of Tailwind config, global style, theme helper/control, dark-mode class edits, and tests. No backend or database rollback is needed.
