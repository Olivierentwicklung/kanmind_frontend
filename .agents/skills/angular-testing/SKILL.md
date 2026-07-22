---
name: angular-testing
description: Use when adding or reviewing Angular 22, Vitest, Playwright, Angular Testing Library, Signal Store, resource, guard or data-access tests.
---

# Angular 22 Testing Workflow

## Principles

- Test observable behavior.
- Use Arrange, Act and Assert.
- Keep tests zoneless-compatible.
- Do not weaken tests to make implementation pass.
- Avoid testing private implementation details.

## Presentational components

Test:

- rendering from inputs
- output events
- user interaction
- empty states
- validation messages
- accessible names and keyboard behavior

## Containers

Test:

- store signals are forwarded to child inputs
- child events call the correct store methods
- route inputs are connected correctly

Do not repeat store behavior tests here.

## Signal Stores

Test:

- initial state
- computed state
- loading
- success
- failure
- reset
- entity updates
- selected higher-order operator behavior where important
- navigation and notification side effects

## Resources

Test:

- initial loading
- successful result
- failure
- reactive request changes
- replacement/cancellation behavior where relevant

## Data access

Use Angular HTTP testing utilities to verify:

- method
- URL
- query parameters
- headers
- request body
- DTO mapping
- error mapping

## Guards

Test both:

- allowed access
- denied access

## Zoneless rules

Do not add:

```ts
import 'zone.js/testing';
fakeAsync(...)
tick(...)
```

unless the repository is explicitly legacy Zone-based.

Prefer:

```ts
await fixture.whenStable();
```

Use `TestBed.tick()` when supported and appropriate.

## TDD cycle

1. Add or update a failing test.
2. Implement the smallest correct behavior.
3. Refactor.
4. Run focused tests.
5. Run affected tests.

## Checklist

- [ ] Success path covered.
- [ ] Expected failure covered.
- [ ] Loading state covered.
- [ ] Empty state covered when relevant.
- [ ] Permission behavior covered.
- [ ] Tests verify behavior, not internals.
- [ ] No legacy Zone dependency was introduced.
