---
name: angular-code-review
description: Use when reviewing Angular/Nx changes for correctness, architecture, state, tests, accessibility, security and performance.
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

- presentational components stay stateless
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
- SSR/hydration compatibility
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

Do not approve merely because tests pass.
