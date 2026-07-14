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
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000
```

`NEXT_PUBLIC_API_BASE_URL` is required by the frontend API client and should point to the MiniBlog backend origin without a trailing slash.

## Routes

- `/` is a simple landing page with Login and Register entry points.
- `/blogs` lists published blog posts from `GET /blogs`.
- `/blogs/[slug]` displays one published blog post from `GET /blogs/:slug`.
- `/login` contains the login form and redirects to `/dashboard` after a successful login.
- `/register` contains the registration form. Registration does not log the user in automatically.
- `/dashboard` loads the authenticated user with `GET /auth/me` using the development access token.

## Authentication Status

Login and registration forms are wired to the backend auth endpoints through `src/lib/api/auth.ts`.
Blog endpoint helpers live in `src/lib/api/blogs.ts` and use the same `NEXT_PUBLIC_API_BASE_URL`, JSON error parsing, credential mode, and bearer access-token pattern as the auth client.

For development only, a successful login stores the returned access token in `localStorage` under `miniblog.dev.accessToken` so the UI can reload the current user with `GET /auth/me`. This is not a production token-storage strategy. Refresh-token automation, durable session handling, and production auth hardening are not implemented yet.

## Lint

```bash
npm run lint
```

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

- Backend API integration currently includes auth helpers and a typed blog API client.
- Auth UI uses development-only access-token storage.
- Profile editing, blog write UI, refresh-token automation, and comments are not implemented in the frontend yet.
- No frontend test runner is configured yet.
