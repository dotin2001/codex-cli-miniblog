# API Contract

## Local URLs

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://127.0.0.1:8080
```

Auth, current-user, blog, and comment endpoints allow browser requests from the frontend origins configured by `CORS_ORIGINS`. The default local origins are:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Credentialed auth requests support JSON request bodies, the `Authorization` header, and refresh-token cookies.

Public blog and comment read requests do not require authentication. Authenticated user blog reads, blog writes, and comment writes support JSON request bodies where needed and the `Authorization` header.

## Implemented Endpoints

### GET /health

Checks whether the Flask API process is reachable.

Request body: none.

Success response:

```json
{
  "status": "ok"
}
```

Status code:

```text
200 OK
```

Example:

```bash
curl http://127.0.0.1:8080/health
```

### POST /auth/register

Creates a user account. This endpoint stores a securely hashed password and does not return tokens, set cookies, log the user in, or create refresh-token state.

Request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct-horse-battery"
}
```

Validation:

- `name` is required, trimmed before storage, and must be 120 characters or fewer.
- `email` is required, trimmed, lowercased before storage, must be a valid email address, and must be unique.
- `password` is required and must be at least 8 characters.

Success response:

```json
{
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

Status code:

```text
201 Created
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid registration request.",
    "fields": {
      "name": "Name is required.",
      "email": "Enter a valid email address.",
      "password": "Password must be at least 8 characters."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Duplicate email error response:

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email is already registered."
  }
}
```

Status code:

```text
409 Conflict
```

Example:

```bash
curl -X POST http://127.0.0.1:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"correct-horse-battery"}'
```

### POST /auth/login

Verifies a user's email and password. On success, this endpoint returns a signed access-token JWT and the public user object. It also sets a refresh-token cookie for issuing later access tokens.

Request body:

```json
{
  "email": "ada@example.com",
  "password": "correct-horse-battery"
}
```

Validation:

- `email` is required, trimmed, lowercased before lookup, and must be a valid email address.
- `password` is required.

Success response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

Access token:

- Signed with HS256 using backend config value `JWT_SECRET_KEY`.
- Expires after `JWT_ACCESS_TOKEN_EXPIRES_SECONDS` seconds. The default is 900 seconds.
- Includes `sub` as the user id string, `user` as the public user object, and standard `iat` and `exp` claims.

Refresh token cookie:

- Cookie name defaults to `refreshToken`.
- Signed with HS256 using backend config value `JWT_SECRET_KEY`.
- Expires after `JWT_REFRESH_TOKEN_EXPIRES_SECONDS` seconds. The default is 604800 seconds.
- Uses `HttpOnly`, `SameSite=Lax`, and `Path=/auth`.
- Uses `Secure=false` by default so it works over local HTTP development. Set `REFRESH_TOKEN_COOKIE_SECURE=true` for HTTPS environments.
- Includes `sub` as the user id string, `typ` as `refresh`, and standard `iat` and `exp` claims.

Status code:

```text
200 OK
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid login request.",
    "fields": {
      "email": "Enter a valid email address.",
      "password": "Password is required."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Invalid credentials error response:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

Status code:

```text
401 Unauthorized
```

Example:

```bash
curl -X POST http://127.0.0.1:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"correct-horse-battery"}'
```

### POST /auth/refresh

Issues a new access-token JWT from a valid refresh-token cookie.

Request body: none.

Cookies:

```text
refreshToken=<refresh-token-jwt>
```

Success response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid refresh token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the refresh-token cookie is missing, invalid, expired, not a refresh token, or references a user that no longer exists.

Example:

```bash
curl -X POST http://127.0.0.1:8080/auth/refresh \
  --cookie "refreshToken=<refresh-token-jwt>"
```

### POST /auth/logout

Clears the refresh-token cookie.

Request body: none.

Success response:

```json
{
  "message": "Logged out."
}
```

Status code:

```text
200 OK
```

Example:

```bash
curl -X POST http://127.0.0.1:8080/auth/logout
```

### GET /auth/me

Returns the current authenticated user for a valid access-token JWT.

Request body: none.

Headers:

```text
Authorization: Bearer <accessToken>
```

Success response:

```json
{
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Example:

```bash
curl http://127.0.0.1:8080/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### GET /me/blogs

Returns blogs authored by the current authenticated user with basic pagination. Draft and published blogs are included. Blogs authored by other users are not included.

Public blog read behavior is unchanged: `GET /blogs` and `GET /blogs/:slug` only return published blogs.

Request body: none.

Headers:

```text
Authorization: Bearer <accessToken>
```

Query parameters:

- `page` is optional and defaults to `1`.
- `perPage` is optional and defaults to `10`.
- `perPage` is capped at `50`.

Success response:

```json
{
  "blogs": [
    {
      "id": 1,
      "title": "My Draft Post",
      "slug": "my-draft-post",
      "excerpt": "A private draft summary.",
      "content": "Draft content.",
      "status": "draft",
      "authorId": 1,
      "createdAt": "2026-07-13T10:00:00",
      "updatedAt": "2026-07-13T10:00:00",
      "author": {
        "id": 1,
        "name": "Ada Lovelace"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Example:

```bash
curl "http://127.0.0.1:8080/me/blogs?page=1&perPage=10" \
  -H "Authorization: Bearer <accessToken>"
```

### GET /blogs

Returns published blogs with basic pagination. Draft blogs are not included.

Query parameters:

- `page` is optional and defaults to `1`.
- `perPage` is optional and defaults to `10`.
- `perPage` is capped at `50`.

Success response:

```json
{
  "blogs": [
    {
      "id": 1,
      "title": "My First Post!",
      "slug": "my-first-post",
      "excerpt": "A short summary.",
      "content": "Hello from MiniBlog.",
      "status": "published",
      "authorId": 1,
      "createdAt": "2026-07-13T10:00:00",
      "updatedAt": "2026-07-13T10:00:00",
      "author": {
        "id": 1,
        "name": "Ada Lovelace"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Status code:

```text
200 OK
```

Example:

```bash
curl "http://127.0.0.1:8080/blogs?page=1&perPage=10"
```

### GET /blogs/:slug

Returns one published blog by slug. Draft blogs are not returned.

Request body: none.

Success response:

```json
{
  "blog": {
    "id": 1,
    "title": "My First Post!",
    "slug": "my-first-post",
    "excerpt": "A short summary.",
    "content": "Hello from MiniBlog.",
    "status": "published",
    "authorId": 1,
    "createdAt": "2026-07-13T10:00:00",
    "updatedAt": "2026-07-13T10:00:00",
    "author": {
      "id": 1,
      "name": "Ada Lovelace"
    }
  }
}
```

Status code:

```text
200 OK
```

Not found response:

```json
{
  "error": {
    "code": "BLOG_NOT_FOUND",
    "message": "Blog was not found."
  }
}
```

Status code:

```text
404 Not Found
```

The not found response is returned when the slug does not exist or belongs to a draft blog.

Example:

```bash
curl http://127.0.0.1:8080/blogs/my-first-post
```

### GET /blogs/:slug/mine

Returns one blog by slug for the current authenticated author. This endpoint can return draft or published blogs, but only when the current user authored the blog.

Public blog read behavior is unchanged: `GET /blogs` and `GET /blogs/:slug` only return published blogs.

Request body: none.

Headers:

```text
Authorization: Bearer <accessToken>
```

Success response:

```json
{
  "blog": {
    "id": 1,
    "title": "My Draft Post",
    "slug": "my-draft-post",
    "excerpt": "A private draft summary.",
    "content": "Draft content.",
    "status": "draft",
    "authorId": 1,
    "createdAt": "2026-07-13T10:00:00",
    "updatedAt": "2026-07-13T10:00:00"
  }
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

Authorization error response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the blog author can view this blog."
  }
}
```

Status code:

```text
403 Forbidden
```

Not found response:

```json
{
  "error": {
    "code": "BLOG_NOT_FOUND",
    "message": "Blog was not found."
  }
}
```

Status code:

```text
404 Not Found
```

Example:

```bash
curl http://127.0.0.1:8080/blogs/my-draft-post/mine \
  -H "Authorization: Bearer <accessToken>"
```

### GET /blogs/:slug/comments

Returns comments for one published blog by slug. Draft blogs are not returned.

Request body: none.

Success response:

```json
{
  "comments": [
    {
      "id": 1,
      "content": "Great post.",
      "authorId": 2,
      "blogId": 1,
      "createdAt": "2026-07-15T10:00:00",
      "updatedAt": "2026-07-15T10:00:00",
      "author": {
        "id": 2,
        "name": "Grace Hopper"
      }
    }
  ]
}
```

Status code:

```text
200 OK
```

Ordering:

- Comments are ordered by `createdAt` ascending, then by `id` ascending.

Not found response:

```json
{
  "error": {
    "code": "BLOG_NOT_FOUND",
    "message": "Blog was not found."
  }
}
```

Status code:

```text
404 Not Found
```

The not found response is returned when the slug does not exist or belongs to a draft blog.

Example:

```bash
curl http://127.0.0.1:8080/blogs/my-first-post/comments
```

### POST /blogs/:slug/comments

Creates a comment on one published blog for the current authenticated user.

Headers:

```text
Authorization: Bearer <accessToken>
```

Request body:

```json
{
  "content": "Great post."
}
```

Validation:

- `content` is required and trimmed before storage.
- `authorId` is set from the authenticated user and cannot be supplied by the client.
- `blogId` is set from the published blog matching `:slug` and cannot be supplied by the client.

Success response:

```json
{
  "comment": {
    "id": 1,
    "content": "Great post.",
    "authorId": 2,
    "blogId": 1,
    "createdAt": "2026-07-15T10:00:00",
    "updatedAt": "2026-07-15T10:00:00",
    "author": {
      "id": 2,
      "name": "Grace Hopper"
    }
  }
}
```

Status code:

```text
201 Created
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid comment request.",
    "fields": {
      "content": "Content is required."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Not found response:

```json
{
  "error": {
    "code": "BLOG_NOT_FOUND",
    "message": "Blog was not found."
  }
}
```

Status code:

```text
404 Not Found
```

The not found response is returned when the slug does not exist or belongs to a draft blog.

Example:

```bash
curl -X POST http://127.0.0.1:8080/blogs/my-first-post/comments \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Great post."}'
```

### PATCH /comments/:comment_id

Updates a comment by id. This endpoint requires a valid bearer access token and only the comment author can update the comment.

Headers:

```text
Authorization: Bearer <accessToken>
```

Request body:

```json
{
  "content": "Updated comment."
}
```

Validation:

- `content` is required, trimmed before storage, and must not be blank.
- `authorId` and `blogId` cannot be changed by the client.

Success response:

```json
{
  "comment": {
    "id": 1,
    "content": "Updated comment.",
    "authorId": 2,
    "blogId": 1,
    "createdAt": "2026-07-15T10:00:00",
    "updatedAt": "2026-07-15T10:05:00",
    "author": {
      "id": 2,
      "name": "Grace Hopper"
    }
  }
}
```

Status code:

```text
200 OK
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid comment request.",
    "fields": {
      "content": "Content cannot be blank."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Authorization error response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the comment author can update this comment."
  }
}
```

Status code:

```text
403 Forbidden
```

Not found response:

```json
{
  "error": {
    "code": "COMMENT_NOT_FOUND",
    "message": "Comment was not found."
  }
}
```

Status code:

```text
404 Not Found
```

Example:

```bash
curl -X PATCH http://127.0.0.1:8080/comments/1 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated comment."}'
```

### DELETE /comments/:comment_id

Deletes a comment by id. This endpoint requires a valid bearer access token and only the comment author can delete the comment.

Headers:

```text
Authorization: Bearer <accessToken>
```

Request body: none.

Success response:

```json
{
  "message": "Comment deleted."
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Authorization error response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the comment author can delete this comment."
  }
}
```

Status code:

```text
403 Forbidden
```

Not found response:

```json
{
  "error": {
    "code": "COMMENT_NOT_FOUND",
    "message": "Comment was not found."
  }
}
```

Status code:

```text
404 Not Found
```

Example:

```bash
curl -X DELETE http://127.0.0.1:8080/comments/1 \
  -H "Authorization: Bearer <accessToken>"
```

### POST /blogs

Creates a blog post for the current authenticated user. This endpoint only creates blog records; likes, categories, and tags are not implemented yet.

Headers:

```text
Authorization: Bearer <accessToken>
```

Request body:

```json
{
  "title": "My First Post!",
  "excerpt": "A short summary.",
  "content": "Hello from MiniBlog.",
  "status": "published"
}
```

Validation:

- `title` is required, trimmed before storage, must be 255 characters or fewer, and must contain letters or numbers so a slug can be generated.
- `content` is required and trimmed before storage.
- `excerpt` is optional, trimmed before storage, stored as `null` when omitted or blank, and must be 500 characters or fewer.
- `status` is optional and defaults to `draft`.
- `status` must be `draft` or `published` when provided.
- `slug` is generated from `title` and made unique by appending a numeric suffix when needed.
- `authorId` is set from the authenticated user and cannot be supplied by the client.

Success response:

```json
{
  "blog": {
    "id": 1,
    "title": "My First Post!",
    "slug": "my-first-post",
    "excerpt": "A short summary.",
    "content": "Hello from MiniBlog.",
    "status": "published",
    "authorId": 1,
    "createdAt": "2026-07-13T10:00:00",
    "updatedAt": "2026-07-13T10:00:00"
  }
}
```

Status code:

```text
201 Created
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid blog request.",
    "fields": {
      "title": "Title is required.",
      "content": "Content is required.",
      "status": "Status must be draft or published."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Example:

```bash
curl -X POST http://127.0.0.1:8080/blogs \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Post!","content":"Hello from MiniBlog.","status":"draft"}'
```

### PATCH /blogs/:slug

Updates a blog post by slug. This endpoint requires a valid bearer access token and only the blog author can update the blog. It can update draft or published blogs.

Headers:

```text
Authorization: Bearer <accessToken>
```

Request body:

```json
{
  "title": "Updated Post Title",
  "excerpt": "Updated summary.",
  "content": "Updated blog content.",
  "status": "published"
}
```

Validation:

- All fields are optional.
- `title`, when provided, is trimmed before storage, must not be blank, must be 255 characters or fewer, and must contain letters or numbers so a slug can be generated.
- The blog `slug` is regenerated only when `title` changes.
- Regenerated slugs are made unique by appending a numeric suffix when needed.
- `content`, when provided, is trimmed before storage and must not be blank.
- `excerpt`, when provided, is trimmed before storage, stored as `null` when blank or `null`, and must be 500 characters or fewer.
- `status`, when provided, must be `draft` or `published`.
- `authorId` cannot be changed by the client.

Success response:

```json
{
  "blog": {
    "id": 1,
    "title": "Updated Post Title",
    "slug": "updated-post-title",
    "excerpt": "Updated summary.",
    "content": "Updated blog content.",
    "status": "published",
    "authorId": 1,
    "createdAt": "2026-07-13T10:00:00",
    "updatedAt": "2026-07-14T10:00:00"
  }
}
```

Status code:

```text
200 OK
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid blog request.",
    "fields": {
      "title": "Title cannot be blank.",
      "content": "Content cannot be blank.",
      "status": "Status must be draft or published."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

Authorization error response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the blog author can update this blog."
  }
}
```

Status code:

```text
403 Forbidden
```

Not found response:

```json
{
  "error": {
    "code": "BLOG_NOT_FOUND",
    "message": "Blog was not found."
  }
}
```

Status code:

```text
404 Not Found
```

Example:

```bash
curl -X PATCH http://127.0.0.1:8080/blogs/my-first-post \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Post Title","status":"published"}'
```

### DELETE /blogs/:slug

Deletes a blog post by slug. This endpoint requires a valid bearer access token and only the blog author can delete the blog. It can delete draft or published blogs.

Headers:

```text
Authorization: Bearer <accessToken>
```

Request body: none.

Success response:

```json
{
  "message": "Blog deleted."
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Authorization error response:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the blog author can delete this blog."
  }
}
```

Status code:

```text
403 Forbidden
```

Not found response:

```json
{
  "error": {
    "code": "BLOG_NOT_FOUND",
    "message": "Blog was not found."
  }
}
```

Status code:

```text
404 Not Found
```

Example:

```bash
curl -X DELETE http://127.0.0.1:8080/blogs/my-first-post \
  -H "Authorization: Bearer <accessToken>"
```

## Future API Placeholders

The following API areas are planned or partially implemented.

### Auth

Current status:

- `POST /auth/register` is implemented.
- `POST /auth/login` is implemented.
- Login returns an access-token JWT.
- Login sets an HTTP-only refresh-token cookie.
- `POST /auth/refresh` is implemented and issues a new access-token JWT from a valid refresh-token cookie.
- `POST /auth/logout` is implemented and clears the refresh-token cookie.
- `GET /auth/me` is implemented and requires a valid bearer access token.

### Users

Planned endpoints may include:

- `GET /users/me`
- `PATCH /users/me`

Current status:

- User model and registration persistence are implemented.
- The current authenticated user is available through `GET /auth/me`.
- Editable profile endpoints are not implemented.

### Blogs

Planned endpoints may include:

- Additional blog workflow endpoints may be added later.

Current status:

- `GET /blogs` is implemented and returns published blogs with pagination.
- `GET /blogs/:slug` is implemented and returns one published blog by slug.
- `GET /blogs/:slug/mine` is implemented and only allows the blog author to fetch their own draft or published blog.
- `GET /me/blogs` is implemented and returns the current authenticated user's draft and published blogs with pagination.
- `POST /blogs` is implemented and requires a valid bearer access token.
- `PATCH /blogs/:slug` is implemented and only allows the blog author to update.
- `DELETE /blogs/:slug` is implemented and only allows the blog author to delete.
- Blog model and persistence are implemented.

### Comments

Current status:

- `GET /blogs/:slug/comments` is implemented and returns comments for one published blog.
- `POST /blogs/:slug/comments` is implemented and requires a valid bearer access token.
- `PATCH /comments/:comment_id` is implemented and only allows the comment author to update.
- `DELETE /comments/:comment_id` is implemented and only allows the comment author to delete.
- Comment model and persistence are implemented.

## Notes

- MySQL is configured for local development through the backend SQLAlchemy settings.
- Update this document whenever a backend endpoint is added or changed.
