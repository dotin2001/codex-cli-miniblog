# Full-Stack Data Flow

This document maps MiniBlog user-facing workflows across the frontend, API helpers, backend endpoints, auth mode, database persistence, and verification owner. Keep endpoint request/response details authoritative in `docs/api-contract.md`, auth/session details in `docs/auth-flow.md`, and schema details in `docs/database.md`.

## Map Rules

- Frontend routes live in `apps/web/src/app`.
- Frontend API helpers live in `apps/web/src/lib/api`.
- Shared browser auth behavior lives in `apps/web/src/lib/auth-session.ts`.
- Route helpers live in `apps/web/src/lib/routes.ts`.
- Backend endpoints are registered through Flask Blueprints in `apps/api/app/routes`.
- Database-backed persistence uses `users`, `blogs`, and `comments`.
- API errors use `{ "error": { "code", "message", "fields?" } }`.
- Protected frontend operations use `runWithFreshAccessToken()`, bearer access tokens, and one refresh retry after `401 Unauthorized`.

## Authentication

| Workflow | Frontend surface | Frontend helper/session | Backend endpoint | Auth mode | Data and persistence | Response and errors | Verification owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Register account | `/register`, `RegisterPanel` | `register()` in `auth.ts` | `POST /auth/register` | Public JSON request | Inserts `users.name`, `users.email`, `users.password_hash`; normalizes email; stores password hash; no token state | `201 { user }`; `400 VALIDATION_ERROR`; `409 EMAIL_ALREADY_EXISTS` | Backend auth tests; frontend static auth test; API contract docs |
| Login | `/login`, `LoginPanel` | `login()`, then `setStoredAccessToken()` | `POST /auth/login` | Public JSON request with credentialed cookie support | Reads `users.email` and `password_hash`; does not create database-backed session state | `200 { accessToken, user }`; sets `refreshToken` HTTP-only cookie; `400 VALIDATION_ERROR`; `401 INVALID_CREDENTIALS` | Backend login tests; frontend auth-session static test; auth-flow docs |
| Load current user | `/dashboard`, `DashboardPanel`; ownership checks in blog/comment components | `runWithFreshAccessToken()` -> `getMe()` | `GET /auth/me` | `Authorization: Bearer <accessToken>` | Reads `users.id`; returns public user only | `200 { user }`; `401 UNAUTHORIZED` with bearer-token message | Backend current-user tests; frontend static auth-session test |
| Refresh access token | Protected client components through `runWithFreshAccessToken()` | `refreshStoredAccessToken()` -> `refresh()` | `POST /auth/refresh` | HTTP-only `refreshToken` cookie on `/auth` | Reads user id from refresh token; loads `users`; no refresh-token table | `200 { accessToken }`; `401 UNAUTHORIZED` with refresh-token message; clears stored access token on failure | Backend refresh/logout tests; frontend static auth-session test |
| Logout | `/dashboard`, `DashboardPanel` | `logout()`, then `clearStoredAccessToken()` | `POST /auth/logout` | Credentialed request; no bearer token required | Clears refresh cookie only; no database-backed token revocation | `200 { message: "Logged out." }` | Backend refresh/logout tests; frontend auth flow review |

## Public Blog Reads

| Workflow | Frontend surface | Frontend helper/session | Backend endpoint | Auth mode | Data and persistence | Response and errors | Verification owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Browse published blogs | `/blogs`, `BlogsPage` | `getBlogs({ page, perPage })` | `GET /blogs` | Public | Reads `blogs` filtered to `status = published`; joins author; orders by `created_at DESC, id DESC`; uses `blogs(status, created_at, id)` plus `users.id` | `200 { blogs, pagination }`; API errors render public error state | Backend blog read tests; frontend build/typecheck; database doc |
| Read published blog detail | `/blogs/[slug]`, metadata generation | `getBlog(slug)` | `GET /blogs/<slug>` | Public | Reads `blogs.slug` and `blogs.status = published`; joins author; `blogs.slug` is unique and indexed | `200 { blog }`; `404 BLOG_NOT_FOUND`; metadata maps not-found to noindex | Backend blog read tests; frontend build/typecheck |
| Read comments for published blog | `/blogs/[slug]`, `CommentsSection` | `getComments(slug)` | `GET /blogs/<slug>/comments` | Public | Reads published blog by slug, then `comments.blog_id`; joins author; orders by `created_at ASC, id ASC`; uses `comments(blog_id, created_at, id)` | `200 { comments }`; `404 BLOG_NOT_FOUND` | Backend comment read tests; frontend build/typecheck; database doc |

## Author Blog Management

| Workflow | Frontend surface | Frontend helper/session | Backend endpoint | Auth mode | Data and persistence | Response and errors | Verification owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| List current author's blogs | `/dashboard/blogs`, `MyBlogsPage` | `runWithFreshAccessToken()` -> `getMyBlogs({ page, perPage }, accessToken)` | `GET /me/blogs` | Bearer access token with refresh retry | Reads `blogs.author_id`; includes `draft` and `published`; orders by `created_at DESC, id DESC`; uses `blogs(author_id, created_at, id)` | `200 { blogs, pagination }`; `401 UNAUTHORIZED` clears local token and prompts login | Backend dashboard blog tests; frontend static map test |
| Create blog | `/dashboard/blogs/new`, `NewBlogPage` | `runWithFreshAccessToken()` -> `createBlog(payload, accessToken)` | `POST /blogs` | Bearer access token with refresh retry | Inserts `blogs` with `title`, generated unique `slug`, nullable `excerpt`, `content`, `status`, `author_id`; status is `draft` or `published`; retries late slug collisions | `201 { blog }`; `400 VALIDATION_ERROR`; `401 UNAUTHORIZED`; `409 BLOG_SLUG_CONFLICT` if bounded slug retry is exhausted | Backend create tests; frontend form review; API contract docs |
| Load own draft or published blog for editing | `/dashboard/blogs/[slug]/edit`, `EditBlogClient` | `runWithFreshAccessToken()` -> `getMyBlog(slug, accessToken)` plus `getMe()` | `GET /blogs/<slug>/mine`; `GET /auth/me` | Bearer access token with refresh retry | Reads `blogs.slug` regardless of status; compares `blogs.author_id` to current user | `200 { blog }`; `401 UNAUTHORIZED`; `403 FORBIDDEN`; `404 BLOG_NOT_FOUND` | Backend update/read tests; frontend static map test |
| Update blog | `/dashboard/blogs/[slug]/edit`, `EditBlogClient` | `runWithFreshAccessToken()` -> `updateBlog(slug, payload, accessToken)` | `PATCH /blogs/<slug>` | Bearer access token with refresh retry | Updates mutable `blogs` fields; regenerates slug only when title changes; preserves author; retries late slug collisions | `200 { blog }`; `400 VALIDATION_ERROR`; `401 UNAUTHORIZED`; `403 FORBIDDEN`; `404 BLOG_NOT_FOUND`; `409 BLOG_SLUG_CONFLICT` | Backend update tests; frontend build/typecheck; API contract docs |
| Delete blog | `/dashboard/blogs`, `/blogs/[slug]`, edit page | `runWithFreshAccessToken()` -> `deleteBlog(slug, accessToken)` | `DELETE /blogs/<slug>` | Bearer access token with refresh retry | Deletes `blogs`; ORM and database `comments.blog_id -> blogs.id` cascade remove owned comments | `200 { message: "Blog deleted." }`; `401 UNAUTHORIZED`; `403 FORBIDDEN`; `404 BLOG_NOT_FOUND` | Backend delete tests; database hardening tests; frontend static map test |

## Comments

| Workflow | Frontend surface | Frontend helper/session | Backend endpoint | Auth mode | Data and persistence | Response and errors | Verification owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Add comment | `/blogs/[slug]`, `CommentsSection` | `runWithFreshAccessToken()` -> `createComment(slug, payload, accessToken)` | `POST /blogs/<slug>/comments` | Bearer access token with refresh retry | Reads published blog by slug; inserts `comments.content`, `comments.author_id`, `comments.blog_id` | `201 { comment }`; `400 VALIDATION_ERROR`; `401 UNAUTHORIZED`; `404 BLOG_NOT_FOUND` | Backend comment mutation tests; frontend comments review |
| Edit own comment | `/blogs/[slug]`, `CommentsSection` | `runWithFreshAccessToken()` -> `updateComment(commentId, payload, accessToken)` | `PATCH /comments/<comment_id>` | Bearer access token with refresh retry | Reads `comments.id`; compares `comments.author_id` to current user; updates `comments.content` | `200 { comment }`; `400 VALIDATION_ERROR`; `401 UNAUTHORIZED`; `403 FORBIDDEN`; `404 COMMENT_NOT_FOUND` | Backend comment mutation tests; frontend comments review |
| Delete own comment | `/blogs/[slug]`, `CommentsSection` | `runWithFreshAccessToken()` -> `deleteComment(commentId, accessToken)` | `DELETE /comments/<comment_id>` | Bearer access token with refresh retry | Reads `comments.id`; compares `comments.author_id`; deletes one comment | `200 { message: "Comment deleted." }`; `401 UNAUTHORIZED`; `403 FORBIDDEN`; `404 COMMENT_NOT_FOUND` | Backend comment mutation tests; frontend comments review |

## Runtime And Support Surface

| Workflow | Frontend surface | Frontend helper/session | Backend endpoint | Auth mode | Data and persistence | Response and errors | Verification owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Health check | None; operational/API check only | None | `GET /health` | Public | No database persistence | `200 { status: "ok" }` | Backend health smoke checks; API contract docs |
| API client configuration | All frontend API helpers | `request()` reads `NEXT_PUBLIC_API_BASE_URL`; sends `credentials: "include"` | All configured API endpoints | Public or bearer depending on caller | No direct persistence; enables cookie-based refresh flow | Throws `CONFIGURATION_ERROR`, `INVALID_JSON_RESPONSE`, or API error envelope wrappers client-side | Frontend static tests; frontend typecheck/build |

## Database Trace Summary

| Table | Product workflows | Important fields | Current access paths and constraints |
| --- | --- | --- | --- |
| `users` | Registration, login, current user, ownership checks, comment/blog author serialization | `id`, `name`, `email`, `password_hash`, timestamps | `users.email` unique index; password hashes are never exposed; user deletion is restricted while authored blogs or comments exist |
| `blogs` | Public blog list/detail, author dashboard, create/update/delete, comment scoping | `id`, `title`, `slug`, `excerpt`, `content`, `status`, `author_id`, timestamps | `blogs.slug` unique index; `status` is `draft` or `published`; indexes on `(status, created_at, id)` and `(author_id, created_at, id)` |
| `comments` | Public comment list, authenticated comment create/update/delete, blog deletion cascade | `id`, `content`, `author_id`, `blog_id`, timestamps | Index on `(blog_id, created_at, id)`; `comments.blog_id` cascades on blog delete; `comments.author_id` restricts user deletion |

## Drift Review Checklist

- Compare frontend helper paths in `apps/web/src/lib/api/*.ts` with this map and `docs/api-contract.md`.
- Compare protected frontend actions with `runWithFreshAccessToken()` and `docs/auth-flow.md`.
- Compare backend Blueprint routes in `apps/api/app/routes` with this map and `docs/api-contract.md`.
- Compare route query patterns and persistence behavior with `apps/api/app/models` and `docs/database.md`.
- Record behavior or schema drift as a separate proposal when fixing it would change endpoint paths, response shapes, auth requirements, database schema, or UI behavior.

## Verification Matrix

| Area | Command |
| --- | --- |
| OpenSpec artifacts | `openspec validate map-fullstack-data-flow --strict` |
| Frontend static map coverage | `cd apps/web && npm run test` |
| Frontend type and route helper safety | `cd apps/web && npm run typecheck` |
| Backend route/model/doc coverage | `cd apps/api && python3 -B -m unittest discover -s tests` |
| Diff hygiene | `git diff --check` |

## Review Result

The map reflects the current MiniBlog code and docs reviewed for this change. No runtime behavior, endpoint contract, database schema, dependency, or UI redesign change is required by this mapping work.
