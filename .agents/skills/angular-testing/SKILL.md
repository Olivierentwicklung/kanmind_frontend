---
name: angular-testing
description: Add or review KanMind Angular 22 tests with Vitest, Angular Testing Library, Angular HTTP testing utilities, and Playwright. Use for components, Signal Stores, guards, data access, routes, accessibility, or complete browser journeys in this zoneless workspace.
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
- navigation and other configured side effects

## Resources

The application does not currently use `resource()` or `httpResource()`. If an
explicitly approved change introduces one, test:

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
5. Run the smallest sufficient repository gate from `AGENTS.md`.

## Checklist

- [ ] Success path covered.
- [ ] Expected failure covered.
- [ ] Loading state covered.
- [ ] Empty state covered when relevant.
- [ ] Permission behavior covered.
- [ ] Tests verify behavior, not internals.
- [ ] No legacy Zone dependency was introduced.
- [ ] Exact commands and actual results are reported.
