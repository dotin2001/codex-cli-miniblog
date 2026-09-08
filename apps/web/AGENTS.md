# MiniBlog Web Agent Instructions

This directory contains the Next.js frontend app.

Use this app for:

- Next.js App Router pages and layouts
- React components
- TypeScript frontend logic
- Tailwind styling
- Forms and client UI state
- Responsive UI
- Frontend API calls and route helpers

Before editing frontend code, read:

- `../../.codex/project.md`
- `../../docs/architecture.md`
- `../../docs/api-contract.md` when API calls are involved
- `../../docs/auth-flow.md` when auth or protected actions are involved
- `../../.codex/skills/miniblog-frontend-nextjs/SKILL.md`

Keep backend business logic out of this app. Use existing API helpers under `src/lib/api`, keep route paths centralized in `src/lib/routes.ts`, and preserve the current App Router server/client boundaries.

Use Vercel React/Next.js best practices as secondary guidance for performance, bundle size, data-fetching, and rerender reviews. Do not add libraries such as SWR, UI kits, or form libraries unless the task cannot reasonably be solved with the existing stack.

Do not manually edit generated Next.js files such as `next-env.d.ts` unless the generated-file issue is the explicit task.

Verify frontend changes with the smallest relevant check, usually one or more of:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```
