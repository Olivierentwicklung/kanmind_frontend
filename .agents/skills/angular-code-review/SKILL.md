---
name: angular-code-review
description: Review KanMind Angular/Nx changes for correctness, configured boundaries, component and Signal Store ownership, zoneless tests, accessibility, security, and performance. Use for implementation reviews, pull-request reviews, and final diff audits in this workspace.
---

# Angular Code Review

Review the complete diff, not only isolated files.

## 1. Correctness

Check:

- acceptance criteria
- edge cases
- loading, empty and error behavior
- duplicate user actions
- route and permission behavior
- async concurrency semantics

## 2. Architecture

Check:

- owning scope
- library responsibility
- Nx tags and boundaries
- public API usage
- no deep imports
- no circular dependencies
- DTO/domain/UI separation
- no feature-specific code in shared

## 3. Components

Check:

- presentational components own only local display, form and focus state
- containers remain thin
- no direct HTTP in components
- no component inheritance
- no expensive template methods
- stable `@for` tracking
- modern Angular APIs used appropriately

## 4. State

Check:

- smallest valid state lifetime
- no unnecessary root store
- no duplicated derived state
- writable state not exposed
- resource/store choice is justified
- loading and failure states exist
- RxJS operator matches intended behavior

## 5. Testing

Check:

- success and failure
- loading and empty states
- permissions
- store transitions
- output events
- zoneless compatibility
- no meaningless coverage-only tests

## 6. Accessibility

Check:

- semantic HTML
- accessible names
- keyboard behavior
- focus states
- correct disabled semantics
- understandable loading and errors

## 7. Security

Check:

- no secrets in frontend config
- no client-only authorization
- no unsafe HTML
- no trust in route params or storage
- backend errors are not leaked

## 8. Performance

Check:

- lazy loading
- unnecessary dependencies
- duplicate requests
- global state growth
- heavy computed work
- image handling
- no unrequested SSR or hydration additions
- browser APIs remain isolated behind platform/application abstractions
- caching lifetime and invalidation

## Review output

Report findings by severity:

- Blocker
- Major
- Minor
- Suggestion

For each finding include:

- location
- problem
- consequence
- recommended fix

Report the exact checks run and their actual results. Mark relevant lint, test,
build, or E2E checks as not run when applicable and explain why.

Do not approve merely because tests pass.
