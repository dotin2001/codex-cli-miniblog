## 1. Skill Audit

- [x] 1.1 Inventory every local skill under `.codex/skills` and `.agents/skills`; verify the list includes all MiniBlog skills, all OpenSpec workflow skills, and `.agents/skills/.openspec-target`.
- [x] 1.2 Compare MiniBlog skills against `AGENTS.md`, `.codex/project.md`, `docs/architecture.md`, `docs/api-contract.md`, `docs/database.md`, `docs/auth-flow.md`, app `AGENTS.md` files, `apps/web/package.json`, and `apps/api/requirements.txt`; verify any stale, duplicated, or unclear guidance is recorded before editing.
- [x] 1.3 Compare OpenSpec workflow skills against installed workflow usage and recent command confusion; verify the audit identifies which concerns belong in docs versus generated `.agents/skills/openspec-*/SKILL.md` edits.

## 2. Durable Documentation

- [x] 2.1 Update `AGENTS.md` to document the local skill homes, MiniBlog skill routing, OpenSpec workflow skill routing, and Codex `$openspec-*` invocation syntax; verify it also explains that `/opsx:*`, `/opsx-*`, and `/openspec-*` slash commands are host-dependent and not guaranteed in Codex.
- [x] 2.2 Update `.codex/project.md` so the project structure and coding rules mention `.agents/skills` alongside `.codex` where relevant; verify it still presents `.codex/skills` as the MiniBlog-owned project skill home.
- [x] 2.3 Update `README.md` or another existing durable doc only if the skill inventory needs a human-facing entry point; verify no doc contradicts the `.codex/skills` and `.agents/skills` ownership split.

## 3. MiniBlog Skill Improvements

- [x] 3.1 Update `.codex/skills/miniblog-project-orchestrator/SKILL.md` with the refined skill-maintenance workflow and OpenSpec/MiniBlog skill ownership split; verify it remains concise and points to durable docs instead of duplicating them.
- [x] 3.2 Update `.codex/skills/miniblog-frontend-nextjs/SKILL.md` only if the audit finds frontend guidance drift or ambiguity; verify stack versions, API-helper rules, auth-session rules, and frontend verification commands still match the project.
- [x] 3.3 Update `.codex/skills/miniblog-backend-python/SKILL.md` only if the audit finds backend guidance drift or ambiguity; verify stack versions, Flask/MySQL/auth rules, database guidance, and backend verification commands still match the project.

## 4. OpenSpec Workflow Skill Review

- [x] 4.1 Review `.agents/skills/openspec-*.md` without changing generated workflow mechanics by default; verify each installed workflow role is documented for explore, propose, apply, update, sync, and archive.
- [x] 4.2 If a generated OpenSpec skill must be patched, keep the edit narrowly scoped and verify the skill name, frontmatter, store-aware OpenSpec CLI guidance, and workflow command examples remain coherent.
- [x] 4.3 Verify optional workflow names mentioned by generated skills, such as continue/new-change, are documented as optional or unavailable when not installed.

## 5. Validation and Reporting

- [x] 5.1 Run the system skill validator on every changed `.codex/skills/*` folder when available; verify any validation errors are fixed or documented with a reason.
- [x] 5.2 If any `.agents/skills/openspec-*` file is changed, run the relevant `openspec status` and `openspec instructions` checks to verify the installed CLI still supports the documented workflow behavior.
- [x] 5.3 Run `git diff --check` and review the final diff; verify no frontend, backend, API, database, auth, Docker, or runtime code changed.
- [x] 5.4 Summarize changed skills, reviewed-but-unchanged skills, validation commands, and any skipped app tests; verify the final report explains why frontend/backend tests were not needed.
