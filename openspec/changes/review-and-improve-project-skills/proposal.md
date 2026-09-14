## Why

MiniBlog has useful repo-specific skills, but the current project documentation does not clearly distinguish `.codex/skills` MiniBlog skills from `.agents/skills` OpenSpec workflow skills. That gap has already caused command confusion, so the project should formalize how skills are reviewed, updated, and validated.

## What Changes

- Review all project-local skills in `.codex/skills` and `.agents/skills` against the current MiniBlog docs, package versions, app boundaries, and OpenSpec usage.
- Improve durable documentation so future agents understand which skills are project-specific, which are OpenSpec workflow skills, and which invocation syntax works in Codex.
- Update MiniBlog skill guidance only where it is stale, ambiguous, duplicated, or missing project-specific routing and verification rules.
- Treat generated OpenSpec workflow skills carefully: document their role and Codex invocation names, but avoid hand-editing generated workflow mechanics unless the review finds a repo-local defect that should intentionally be patched.
- Add a repeatable skill maintenance checklist so future updates validate skill frontmatter, naming, routing, and alignment with source-of-truth docs.

## Capabilities

### New Capabilities

- `project-skill-governance`: Requirements for keeping MiniBlog project skills, OpenSpec workflow skills, and durable agent documentation accurate and usable.

### Modified Capabilities

None. There are no existing main OpenSpec specs in this repository yet, so this change introduces the first project skill governance capability.

## Impact

- Shared agent docs: likely updates to `AGENTS.md` and `.codex/project.md` to document project skill homes, OpenSpec workflow skill location, and Codex command syntax.
- MiniBlog skills: possible targeted edits to `.codex/skills/miniblog-project-orchestrator/SKILL.md`, `.codex/skills/miniblog-frontend-nextjs/SKILL.md`, and `.codex/skills/miniblog-backend-python/SKILL.md` if the review finds stale or unclear instructions.
- OpenSpec skills: review `.agents/skills/openspec-*.md` for installed workflow coverage and local command guidance; prefer documenting usage rather than modifying generated workflow internals.
- Validation: add or document a lightweight skill review command/checklist covering frontmatter, descriptions, routing boundaries, generated-skill caveats, and doc/skill consistency.
- No application runtime behavior, API contracts, database schema, frontend UI, backend routes, or dependencies should change.
