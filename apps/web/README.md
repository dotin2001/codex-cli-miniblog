# MiniBlog Web

Frontend app for MiniBlog, built with the Next.js App Router.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint

## Requirements

- Node.js `>=20.9.0`
- npm

The app is configured for Node 20 LTS compatibility. Builds will fail on older Node versions.

## Local Setup

```bash
cd apps/web
npm install
```

## Development

```bash
npm run dev
```

The dev server starts with Next.js at `http://localhost:3000` by default.

## Environment Variables

Create `apps/web/.env.local` for local frontend configuration:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_BASE_URL` is required by the frontend API client and should point to the MiniBlog backend origin without a trailing slash.

`NEXT_PUBLIC_SITE_URL` is used by generated metadata routes such as `sitemap.xml` and `robots.txt`. It should point to the public frontend origin without a trailing slash.

## Routes

- `/` is a simple landing page with Login and Register entry points.
- `/blogs` lists published blog posts from `GET /blogs` and shows a development-only `Create Blog` CTA when `localStorage` contains `miniblog.dev.accessToken`.
- `/blogs/[slug]` displays one published blog post from `GET /blogs/:slug`, shows comments from `GET /blogs/:slug/comments`, allows authenticated users to post comments, shows comment author-only edit/delete actions, and shows blog author-only `Edit Blog` and `Delete Blog` actions when `GET /auth/me` matches the blog author.
- `/dashboard/blogs` lists the authenticated user's draft and published blog posts from `GET /me/blogs`, with create, view, edit, and delete actions.
- `/dashboard/blogs/new` creates a blog post with `POST /blogs` using the development access token. Draft posts redirect to the dashboard edit route; published posts redirect to the public detail route.
- `/dashboard/blogs/[slug]/edit` loads the blog with `GET /blogs/:slug/mine`, loads the current user with `GET /auth/me`, and allows update/delete only when the current user is the blog author.
- `/login` contains the login form and redirects to `/dashboard` after a successful login.
- `/register` contains the registration form. Registration does not log the user in automatically.
- `/dashboard` loads the authenticated user with `GET /auth/me` using the development access token and links to `/dashboard/blogs` and `/dashboard/blogs/new`.

## Authentication Status

Login and registration forms are wired to the backend auth endpoints through `src/lib/api/auth.ts`.
Blog endpoint helpers live in `src/lib/api/blogs.ts`, and comment endpoint helpers live in `src/lib/api/comments.ts`. They use the same `NEXT_PUBLIC_API_BASE_URL`, JSON error parsing, credential mode, and bearer access-token pattern as the auth client.

For development only, a successful login stores the returned access token in `localStorage` under `miniblog.dev.accessToken` so the UI can reload the current user with `GET /auth/me`. This is not a production token-storage strategy. Refresh-token automation, durable session handling, and production auth hardening are not implemented yet.

## Lint

```bash
npm run lint
```

## Typecheck

```bash
npm run typecheck
```

The typecheck script runs Next.js route type generation before TypeScript and checks only the production route types. This keeps the standalone TypeScript check reliable after `next dev` has generated `.next/dev/types`.

## Build

Use Node 20 or newer:

```bash
npm run build
```

If your active shell is not using Node 20, run the build with a temporary Node 20 runtime:

```bash
npx -p node@20 node node_modules/next/dist/bin/next build
```

## Folder Structure

```text
apps/web/
├── src/app/
│   ├── dashboard/
│   │   └── blogs/
│   │       ├── [slug]/
│   │       ├── page.tsx
│   │       └── new/
│   ├── blogs/
│   │   └── [slug]/
│   ├── login/
│   ├── register/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── src/lib/api/
│   ├── auth.ts
│   ├── blogs.ts
│   ├── comments.ts
│   └── client.ts
├── .env.example
├── eslint.config.mjs
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Current Limitations

- Auth UI uses development-only access-token storage.
- Profile editing, refresh-token automation, and comment moderation UI are not implemented in the frontend yet.
- No frontend test runner is configured yet.
