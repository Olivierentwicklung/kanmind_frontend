---
name: angular-feature
description: Implement a complete KanMind Angular business feature or vertical slice across the configured Nx feature, domain, data-access, and UI boundaries. Use for routed behavior that needs coordinated ownership, state, forms, transport, tests, and verification.
---

# Angular Feature Workflow

## Goal

Implement a complete feature with clear ownership, correct dependency direction, tests and verification.

## Procedure

1. Read the root `AGENTS.md`.
2. Inspect the relevant route configuration, feature scope, project tags and existing tests.
3. Identify the business capability and acceptance criteria.
4. Determine the smallest useful ownership structure from the configured
   `feature`, `domain`, `data-access`, and `ui` types. Do not create a library
   to complete a theoretical matrix. A future `util` library requires a
   justified owner and must fit the current ESLint constraints.
5. Reuse existing libraries when responsibilities already match.
6. Define route ownership and lazy-loading behavior.
7. Define DTOs, domain models, commands and view models where needed.
8. Decide state lifetime:
   - component signal for local display, form, or focus state
   - page-provided Signal Store for dashboard, boards collection, or board detail state
   - root `AuthStore` only for the cross-route authenticated session
   - another scope only when the use case and lifecycle explicitly justify it
9. Do not introduce `resource()` or `httpResource()` without documenting
   ownership, lifecycle, refresh, cancellation, and why the existing
   repository/Signal Store pattern is insufficient.
10. Define loading, empty, success and error behavior.
11. Select RxJS concurrency from the use-case semantics.
12. Use Signal Forms for supported form behavior; document any typed reactive
    forms exception.
13. Write or update tests before implementation where practical.
14. Implement the smallest complete vertical slice.
15. Run focused checks, then the smallest sufficient repository gate from
    `AGENTS.md`.
16. Review module boundaries, accessibility, security and performance.

## Required output before coding

For non-trivial work, provide a short plan containing:

- owning scope
- affected libraries
- dependency direction
- routes
- state decision
- resource-versus-store decision
- form and RxJS concurrency decisions
- test plan
- verification commands

## Feature completion checklist

- [ ] Business behavior matches acceptance criteria.
- [ ] Route ownership is correct.
- [ ] Top-level feature is lazy-loaded when appropriate.
- [ ] Component responsibilities are separated.
- [ ] State lifetime is justified.
- [ ] Resource/store, form and concurrency choices match repository policy.
- [ ] Loading, empty and error states exist.
- [ ] DTOs do not leak unnecessarily into UI.
- [ ] Nx boundaries are respected.
- [ ] Tests cover success and failure.
- [ ] Accessibility was reviewed.
- [ ] Focused and proportionate repository checks were run and reported truthfully.
