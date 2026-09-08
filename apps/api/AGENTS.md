# MiniBlog API Agent Instructions

This directory contains the Flask backend app.

Use this app for:

- API routes and Blueprints
- Authentication and authorization
- SQLAlchemy models
- Flask-Migrate migrations
- Validation and error responses
- Backend tests
- MySQL/PyMySQL runtime configuration

Before editing backend code, read:

- `../../.codex/project.md`
- `../../docs/architecture.md`
- `../../docs/api-contract.md`
- `../../docs/database.md` when changing models, migrations, or schema
- `../../docs/auth-flow.md` when changing authentication, JWT, refresh tokens, cookies, or protected routes
- `../../.codex/skills/miniblog-backend-python/SKILL.md`

Keep frontend UI logic out of this app. Preserve the Flask app factory, existing Blueprint patterns, documented API error envelopes, and MySQL-compatible runtime behavior.

Use official Flask ecosystem docs for framework behavior. Use Microsoft or Azure Flask guidance only when the task explicitly involves Azure deployment, Microsoft identity, or another Microsoft service.

Verify backend changes with the smallest relevant check, usually:

```bash
python3 -B -m unittest discover -s tests
```
