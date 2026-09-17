## Purpose

Defines how MiniBlog keeps project-local Codex skills and OpenSpec workflow skills accurate, discoverable, and aligned with the repository's durable documentation.

## ADDED Requirements

### Requirement: Skill Inventory Is Documented
The project SHALL document the local skill inventory in a way that distinguishes MiniBlog project skills from OpenSpec workflow skills.

#### Scenario: Agent reviews available project skills
- **WHEN** an agent reads the repository agent instructions
- **THEN** the instructions identify `.codex/skills` as the MiniBlog project skill home and `.agents/skills` as the OpenSpec workflow skill home

#### Scenario: Agent chooses a MiniBlog skill
- **WHEN** a task is frontend-only, backend-only, or full-stack/shared
- **THEN** the documented routing tells the agent which MiniBlog skill applies

#### Scenario: Agent chooses an OpenSpec workflow skill
- **WHEN** a task is exploration, proposal creation, change application, change update, spec sync, or archive
- **THEN** the documented routing tells the agent which OpenSpec workflow skill applies

### Requirement: Skills Align With Durable Project Facts
The project SHALL keep skill instructions synchronized with maintained project docs and current package/runtime facts.

#### Scenario: Project docs change
- **WHEN** durable docs such as `AGENTS.md`, `.codex/project.md`, `docs/architecture.md`, `docs/api-contract.md`, `docs/database.md`, or `docs/auth-flow.md` change a project fact
- **THEN** affected MiniBlog skills are reviewed and updated only where their guidance would otherwise become stale or misleading

#### Scenario: Package or runtime versions change
- **WHEN** frontend or backend dependency versions, runtime URLs, Docker services, or verification commands change
- **THEN** affected skills reflect the updated facts or intentionally avoid pinning details that are not useful for skill routing

#### Scenario: Skills contain duplicate guidance
- **WHEN** a skill repeats large blocks of durable docs without adding task-specific decision guidance
- **THEN** the skill is shortened to reference the source-of-truth doc and keep only operational rules that affect agent behavior

### Requirement: OpenSpec Usage Is Clear In Codex
The project SHALL document how Codex users invoke local OpenSpec workflows and which command forms are unsupported.

#### Scenario: User starts a Codex OpenSpec workflow
- **WHEN** a user wants to run an OpenSpec workflow in Codex
- **THEN** the documentation shows the `$openspec-*` skill invocation form for installed local skills

#### Scenario: User tries unsupported slash aliases
- **WHEN** a user expects `/opsx:*`, `/opsx-*`, or `/openspec-*` slash commands to work in Codex
- **THEN** the documentation explains that those aliases are not guaranteed Codex commands unless separately installed by the host environment

#### Scenario: Generated OpenSpec skills are reviewed
- **WHEN** OpenSpec workflow skills under `.agents/skills` are reviewed
- **THEN** generated workflow mechanics are not hand-edited unless the change intentionally patches a local defect that cannot be handled by documentation or reinstalling/regenerating the skills

### Requirement: Skill Updates Are Validated
The project SHALL validate skill edits before treating skill maintenance work as complete.

#### Scenario: MiniBlog skill is edited
- **WHEN** a `.codex/skills/*/SKILL.md` file is changed
- **THEN** the change verifies required frontmatter, discriminating description, routing boundaries, source-of-truth alignment, and absence of unfinished placeholders

#### Scenario: OpenSpec workflow skill is edited
- **WHEN** a `.agents/skills/openspec-*/SKILL.md` file is changed intentionally
- **THEN** the change verifies the skill still names the correct workflow, preserves OpenSpec CLI store-awareness, and remains compatible with the installed OpenSpec CLI

#### Scenario: Skill maintenance finishes
- **WHEN** a skill review or improvement change is completed
- **THEN** the final report lists which skills were changed, which were reviewed but left unchanged, and which checks were run or skipped
