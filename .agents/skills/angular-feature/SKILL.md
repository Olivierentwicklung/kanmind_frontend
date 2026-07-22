---
name: angular-feature
description: Use when implementing a complete Angular business feature or vertical slice in an Nx workspace.
---

# Angular Feature Workflow

## Goal

Implement a complete feature with clear ownership, correct dependency direction, tests and verification.

## Procedure

1. Read the root `AGENTS.md`.
2. Inspect the relevant route configuration, feature scope, project tags and existing tests.
3. Identify the business capability and acceptance criteria.
4. Determine the smallest useful library structure:
   - `feature`
   - `ui`
   - `domain`
   - `data-access`
   - `util`
5. Reuse existing libraries when responsibilities already match.
6. Define route ownership and lazy-loading behavior.
7. Define DTOs, domain models, commands and view models where needed.
8. Decide state lifetime:
   - component signal
   - resource
   - component-provided Signal Store
   - feature store
   - global store
9. Define loading, empty, success and error behavior.
10. Write or update tests before implementation where practical.
11. Implement the smallest complete vertical slice.
12. Run focused lint, tests and build.
13. Run affected checks.
14. Review module boundaries, accessibility, security and performance.

## Required output before coding

For non-trivial work, provide a short plan containing:

- owning scope
- affected libraries
- dependency direction
- routes
- state decision
- test plan
- verification commands

## Feature completion checklist

- [ ] Business behavior matches acceptance criteria.
- [ ] Route ownership is correct.
- [ ] Top-level feature is lazy-loaded when appropriate.
- [ ] Component responsibilities are separated.
- [ ] State lifetime is justified.
- [ ] Loading, empty and error states exist.
- [ ] DTOs do not leak unnecessarily into UI.
- [ ] Nx boundaries are respected.
- [ ] Tests cover success and failure.
- [ ] Accessibility was reviewed.
- [ ] Focused and affected checks were run.
