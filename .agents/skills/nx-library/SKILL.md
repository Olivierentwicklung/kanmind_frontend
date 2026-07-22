---
name: nx-library
description: Use when creating or restructuring an Nx library and assigning scope/type tags and boundaries.
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
- `ui`: presentational UI
- `domain`: business types, rules and state
- `data-access`: transport and integration
- `util`: pure helpers, validators and small guards

## Choose a scope

Use the owning business capability, for example:

```text
scope:projects
scope:authentication
scope:portfolio
scope:shared
```

## Required tags

Example:

```json
{
  "tags": ["scope:projects", "type:domain"]
}
```

## Public API

Expose only intended public symbols through `src/index.ts`.

Do not expose internal implementation details by default.

Do not deep-import from other libraries.

## Boundary rules

Validate expected direction:

```text
feature -> domain, data-access, ui, util
domain -> data-access, util
data-access -> util
ui -> util
```

Do not allow:

- UI -> feature
- domain -> UI
- data-access -> feature
- circular dependencies
- cross-scope private imports

## Verification

After creating or moving a library:

1. Run lint for the library.
2. Run tests for the library.
3. Run `nx graph` or inspect the graph when useful.
4. Run affected lint, test and build.
5. Verify no deep imports remain.

## Completion checklist

- [ ] Responsibility is singular and clear.
- [ ] Scope and type tags are correct.
- [ ] Public API is minimal.
- [ ] Module boundaries pass.
- [ ] No circular dependency was introduced.
- [ ] Tests moved with ownership.
