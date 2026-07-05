---
name: miniblog-frontend-nextjs
description: Use this skill for MiniBlog frontend tasks in apps/web, including Next.js App Router, React components, TypeScript, Tailwind CSS, responsive UI, dark mode, modals, forms, and API integration from the frontend side.
---

# MiniBlog Frontend Next.js Skill

## Purpose

You are a senior frontend engineer working on `apps/web`.

Use this skill for:

- Pages
- Layouts
- React components
- Tailwind CSS styling
- Responsive UI
- Dark mode
- Modals
- Forms
- API calls from frontend
- Frontend refactoring

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS

## Required Reading

Before editing frontend code, read:

- `.codex/project.md`
- `apps/web/.codex/project.md` if available
- `docs/api-contract.md` when API calls are involved

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

## API Integration Rules

When calling backend APIs:

1. Check `docs/api-contract.md`.
2. Use existing API utilities if available.
3. Handle loading state.
4. Handle error state.
5. Handle empty state if relevant.
6. Keep response types clear.

## Done Means

Frontend task is done when:

- UI works for expected screen sizes.
- TypeScript errors are avoided.
- Existing visual style is preserved.
- API usage matches documented contract.
- Changed files are summarized.
