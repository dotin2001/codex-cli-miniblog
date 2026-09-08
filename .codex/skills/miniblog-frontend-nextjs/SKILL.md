---
name: miniblog-frontend-nextjs
description: Use this skill for MiniBlog frontend tasks in apps/web or frontend AI-instruction updates, including Next.js 16 App Router, React 19 components, TypeScript, Tailwind CSS 3, responsive UI, forms, client auth state, route helpers, frontend API integration, frontend tests, Vercel React/Next.js performance review, and frontend-specific AGENTS.md guidance.
---

# MiniBlog Frontend Next.js Skill

## Purpose

Work as a senior frontend engineer in `apps/web`. Keep UI, routing, client auth state, and API calls aligned with the documented MiniBlog contract.

Use this skill for pages, layouts, React components, Tailwind styling, responsive UI, forms, modals, frontend API calls, client auth behavior, route helpers, frontend tests, and frontend refactoring.

## Stack

- Next.js `16.2.10` App Router
- React `19.2.7`
- TypeScript `6.0.3`
- Tailwind CSS `3.4.17`
- ESLint `9.39.4`
- Node `>=20.9.0`
- npm with `package-lock.json`

No component library, data-fetching library, or form library is currently installed. Do not introduce one unless the existing stack cannot reasonably solve the task.

## Required Reading

Before editing frontend code, read:

- `.codex/project.md`
- `AGENTS.md`
- `apps/web/AGENTS.md`
- `docs/architecture.md`
- `docs/api-contract.md` when API calls are involved
- `docs/auth-flow.md` when auth or protected actions are involved
- The relevant route/component/API helper/test files

When framework behavior is version-sensitive or unclear, consult official docs before editing:

- Next.js App Router: `https://nextjs.org/docs/app`
- Next.js TypeScript: `https://nextjs.org/docs/app/api-reference/config/typescript`
- React reference: `https://react.dev/reference/react`
- Tailwind CSS v3: `https://v3.tailwindcss.com/docs/installation`

Use Vercel React/Next.js best practices as secondary guidance for performance, bundle size, data-fetching, rerender behavior, and App Router boundaries. Apply those rules in a way that fits this repo's current dependency set.

## Frontend Rules

- Use TypeScript.
- Follow existing folder structure.
- Keep components reusable.
- Keep components small when possible.
- Use Tailwind consistently.
- Do not add UI libraries unless requested.
- Do not redesign UI unless explicitly requested.
- Do not hardcode backend business logic in frontend.
- Do not change API contracts from frontend only.
- Preserve App Router server/client boundaries.
- Add `"use client"` only when browser APIs, hooks, events, or client state require it.
- Use `@/*` imports according to `tsconfig.json`.
- Keep route paths centralized in `src/lib/routes.ts` when adding navigable app routes.
- Preserve the existing visual style and responsive behavior.
- Do not claim dark-mode support unless the touched area already implements it or the task adds it intentionally.
- Do not edit generated Next.js files such as `next-env.d.ts` unless the generated-file issue is the explicit task.

## Project-Specific API Rules

Use existing API utilities before adding new request code:

- `src/lib/api/client.ts`
- `src/lib/api/auth.ts`
- `src/lib/api/blogs.ts`
- `src/lib/api/comments.ts`

Preserve these API client conventions:

- `request<TResponse>()` builds URLs from `NEXT_PUBLIC_API_BASE_URL`.
- `credentials: "include"` is used so refresh-token cookies work.
- `Authorization: Bearer <accessToken>` is sent only when an access token is provided.
- Backend error envelopes become `ApiRequestError`.
- Slugs are URL encoded before use in paths.
- Do not add SWR, React Query, UI kits, or form libraries just because external best-practice guidance mentions them.

For protected actions, use `src/lib/auth-session.ts` unless the task deliberately changes auth architecture:

- Development access token storage key: `miniblog.dev.accessToken`
- `useAccessToken()` subscribes through `useSyncExternalStore`.
- `runWithFreshAccessToken()` refreshes and retries once after a `401`.
- Logout clears the stored development access token after calling the API.

## Responsive Rules

UI must work on:

- Mobile
- Tablet
- Desktop

Check:

- Spacing
- Text overflow
- Modal behavior
- Navbar behavior
- Button size
- Form layout

## API Integration Workflow

When calling backend APIs:

1. Check `docs/api-contract.md`.
2. Use existing API utilities if available.
3. Handle loading state.
4. Handle error state.
5. Handle empty state if relevant.
6. Keep response types clear.
7. Update frontend types when response shapes change.
8. Update `docs/api-contract.md` if the backend contract changes.

## Verification

Run the smallest relevant frontend check from `apps/web`:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Choose based on risk:

- API helper, route helper, or auth-session changes: run `npm run test` and `npm run typecheck`.
- TSX/component changes: run `npm run lint` and `npm run typecheck`.
- App Router/build-sensitive changes: run `npm run build`.
- Rendered UI changes: verify the affected page in browser when practical.

## Done Means

Frontend task is done when:

- UI works for expected screen sizes.
- TypeScript errors are avoided.
- Existing visual style is preserved.
- API usage matches documented contract.
- Auth-session behavior is preserved when protected actions are touched.
- Route helpers are updated when route paths change.
- Targeted frontend checks are run, or the reason they were not run is stated.
- Changed files are summarized.
