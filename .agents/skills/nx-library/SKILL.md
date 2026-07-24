---
name: nx-library
description: Create or restructure a KanMind Nx library using the workspace's exact scope/type tags, dependency constraints, aliases, and public APIs. Use when adding a justified library boundary, moving ownership, or reviewing cross-library imports.
---

# Nx Library Workflow

## Before creating a library

Confirm:

- business scope
- responsibility
- consumers
- expected lifetime
- whether an existing library already owns the responsibility
- whether a new boundary provides real value

Do not create a library only to satisfy a theoretical folder structure.

## Choose a type

- `feature`: routed/container orchestration
- `domain`: business types, rules and state
- `data-access`: transport and integration
- `ui`: reusable presentational UI
- `util`: permitted by one boundary rule but no current project uses this type;
  add it only with an explicit ownership and dependency decision

## Choose a scope

Use one of the configured scopes:

```text
scope:app
scope:auth
scope:legal
scope:dashboard
scope:boards
scope:shared
```

## Required tags

Example:

```json
{
  "tags": ["scope:boards", "type:domain"]
}
```

## Public API

Expose only intended public symbols through `src/index.ts`.

Do not expose internal implementation details by default.

Do not deep-import from other libraries.

## Boundary rules

Both the type and scope constraints in `eslint.config.mjs` must pass.

Configured type direction:

```text
app         -> feature, domain, data-access, ui
e2e         -> app
feature     -> domain, data-access, ui
domain      -> data-access
data-access -> no workspace library type
ui          -> ui, util
```

Configured scope direction:

```text
app       -> app, auth, legal, dashboard, boards, shared
auth      -> auth, shared
legal     -> legal, auth, shared
dashboard -> dashboard, auth, shared
boards    -> boards, auth, shared
shared    -> shared
```

Do not weaken these constraints to make an import pass. Do not introduce
circular dependencies, cross-scope private imports, or another library's
`src/lib` path.

## Verification

After creating or moving a library:

1. Run the focused Nx lint target using the real project name.
2. Run its test target when the project owns tests.
3. Inspect the Nx graph when dependency direction is not obvious.
4. Run affected checks and a production build for architecture/configuration
   changes.
5. Verify that configured aliases and `src/index.ts` expose only the intended
   API and no deep imports remain.
6. Report exact commands and actual results.

## Completion checklist

- [ ] Responsibility is singular and clear.
- [ ] Scope and type tags are correct.
- [ ] Public API is minimal.
- [ ] Module boundaries pass.
- [ ] No circular dependency was introduced.
- [ ] Tests moved with ownership.
