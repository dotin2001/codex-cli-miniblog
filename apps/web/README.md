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
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── src/lib/api/
│   └── auth.ts
├── .env.example
├── eslint.config.mjs
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Current Limitations

- The current UI is a static frontend shell.
- Backend API integration is limited to a minimal auth API client.
- Auth, profile, blog CRUD, and comments are not implemented in the frontend yet.
- No frontend test runner is configured yet.
