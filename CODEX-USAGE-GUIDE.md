# Using These Codex Instructions in VS Code

## 1. Copy the files

Place the folder structure at the root of each Angular Nx monorepo:

```text
<workspace-root>/
├── AGENTS.md
├── CODEX-USAGE-GUIDE.md
└── .agents/
    └── skills/
        ├── angular-feature/
        │   └── SKILL.md
        ├── angular-component/
        │   └── SKILL.md
        ├── angular-signal-store/
        │   └── SKILL.md
        ├── nx-library/
        │   └── SKILL.md
        ├── angular-testing/
        │   └── SKILL.md
        └── angular-code-review/
            └── SKILL.md
```

Replace all placeholders in `AGENTS.md`.

Commit these files so Codex uses the same rules for every contributor and session.

---

## 2. What belongs where

### `AGENTS.md`

Use it for permanent repository rules:

- Angular version and APIs
- architecture
- dependency direction
- state policy
- testing rules
- security
- performance
- completion requirements

### Skills

Use skills for repeated procedures:

- implementing a feature
- creating a component
- building a Signal Store
- creating an Nx library
- testing
- reviewing code

Do not duplicate the complete root instruction inside every skill.

---

## 3. Recommended prompt pattern

For non-trivial work, use this structure:

```text
Task:
<Describe the business behavior.>

Acceptance criteria:
- ...
- ...
- ...

Constraints:
- Use the repository AGENTS.md.
- Use the relevant skills in .agents/skills.
- Inspect the existing architecture before changing code.
- Start with a short plan.
- Follow TDD where practical.
- Do not create new libraries unless their responsibility is justified.
- Run focused checks and then affected lint, tests and build.
- Report commands actually executed and any remaining risks.
```

---

## 4. Feature implementation prompt

```text
Implement the authenticated "My Projects" feature.

Acceptance criteria:
- The route is /projects/my.
- Unauthenticated users are redirected to /login.
- The page loads only the current user's projects.
- Users can search by title.
- Users can delete a project after confirmation.
- Loading, empty and error states must be visible.
- Deletion failures must leave the project visible.
- The UI must be keyboard accessible.

Use AGENTS.md and the relevant skills.

Before coding:
1. Inspect the existing projects scope, routes, tags, stores and tests.
2. Propose the affected libraries and dependency direction.
3. Decide whether the state belongs in a component-provided store or feature store.
4. Explain the RxJS operator used for search and deletion.
5. Give a short test plan.

Then implement with tests and run focused plus affected checks.
```

---

## 5. Signal Store prompt

```text
Create or refactor the state for the projects page.

Use AGENTS.md and the angular-signal-store skill.

Requirements:
- State is destroyed when the page is left.
- It contains projects, search query, selected project, loading status and an application-level error.
- Search replaces the previous request.
- Delete must ignore duplicate clicks while one delete request is active.
- Do not expose writable state.
- Do not store derived counts.
- Add tests for initial state, loading, success, error, search replacement and duplicate deletion.

Start with a short state-lifetime and concurrency plan.
```

---

## 6. Component refactoring prompt

```text
Refactor this page into container and presentational components.

Use AGENTS.md and the angular-component skill.

Goals:
- The container may inject the store.
- Presentational components must use signal inputs and outputs.
- Move business and API orchestration out of components.
- Preserve behavior and accessibility.
- Add or update tests.
- Do not introduce component inheritance.

First show the proposed component split and responsibilities.
```

---

## 7. Nx library prompt

```text
Create the minimum Nx library structure for the billing feature.

Use AGENTS.md and the nx-library skill.

Before generating anything:
- Inspect existing scopes, tags, aliases and module-boundary rules.
- Explain why each proposed library is needed.
- Prefer reusing existing libraries.
- Define public APIs and dependency direction.
- Do not create empty speculative libraries.

After implementation, run lint, tests, graph inspection if useful, and affected checks.
```

---

## 8. Review prompt

```text
Review the current branch against AGENTS.md and the angular-code-review skill.

Compare it with <MAIN_BRANCH>.

Review:
- correctness
- Nx boundaries
- component responsibilities
- state lifetime
- resource versus store choice
- RxJS concurrency
- tests
- accessibility
- security
- performance
- SSR/hydration compatibility

Report findings by Blocker, Major, Minor and Suggestion.
For each finding include location, consequence and recommended fix.
Do not modify code until the review is complete.
```

---

## 9. Documentation-only prompt

```text
Analyze the requested feature and create an implementation plan only.

Use AGENTS.md and relevant skills.

Do not modify files.

Include:
- business assumptions
- affected routes
- affected libraries
- dependency direction
- state lifetime
- DTO/domain/view-model boundaries
- loading and error states
- permission behavior
- tests
- verification commands
- risks
```

---

## 10. Recommended working sequence in VS Code

1. Open the monorepo root in VS Code.
2. Start Codex in planning mode for non-trivial features.
3. Give the task, acceptance criteria and explicit constraints.
4. Review the proposed library and state decisions.
5. Let Codex implement the smallest complete vertical slice.
6. Ask Codex to run focused tests.
7. Ask Codex to run affected lint, test and build.
8. Ask for a final architecture and diff review.
9. Commit only after the completion report is accurate.

---

## 11. Keep the instructions useful

Update `AGENTS.md` when the repository changes:

- Angular/Nx testing setup
- package manager
- app names
- aliases
- scope/type tags
- build commands
- SSR configuration
- state conventions

Add a new skill only when a workflow repeats or the same mistake repeatedly appears in code review.

Avoid turning `AGENTS.md` into project documentation. Link to longer architecture documents when necessary.
