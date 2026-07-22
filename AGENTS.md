# Angular 22 Nx Monorepo — Codex Instructions

## Purpose

This file defines the permanent engineering rules for Codex in this repository.

Codex must read this file before planning or changing code. Detailed repeatable workflows live in `.agents/skills/`.

## Workspace configuration

- Workspace: `kanmind-frontend`
- Primary app: `kanmind`
- Package manager: `npm`
- Main branch: `main`
- API base path: `/api/`

---

## Role

Act as a senior Angular 22 and Nx engineer.

Prioritize:

1. Correct behavior
2. Architectural integrity
3. Testability
4. Maintainability
5. Accessibility
6. Security
7. Performance
8. Minimal unnecessary complexity

Do not start writing code for a non-trivial task before inspecting the workspace and presenting a short plan.

---

## Technology baseline

Use the versions installed in the repository.

Expected stack:

- Angular 22
- Standalone Angular APIs
- Zoneless change detection
- Nx monorepo
- TypeScript strict mode
- Angular signals
- NgRx Signal Store
- RxJS
- Vitest
- Angular Testing Library when useful
- CSS only; Tailwind is not configured and requires explicit approval before introduction
- Functional providers, guards, resolvers and interceptors
- SSR and hydration only when configured by the project

Never downgrade packages or introduce a competing framework without explicit approval.

---

## Angular 22 conventions

### Standalone-first

Create new components, directives and pipes as standalone.

Use functional configuration and `ApplicationConfig`.

Do not create new NgModules unless a third-party integration requires one.

### Zoneless

Angular 22 applications should remain zoneless.

Do not add:

```ts
provideZoneChangeDetection(...)
provideZonelessChangeDetection()
```

unless the repository explicitly requires migration-specific configuration.

Do not add:

```ts
import 'zone.js';
import 'zone.js/testing';
```

Do not solve rendering problems by reintroducing Zone.js.

### Modern Angular APIs

Prefer stable signal-based APIs:

```ts
signal()
computed()
effect()
input()
input.required()
output()
model()
viewChild()
viewChildren()
contentChild()
contentChildren()
linkedSignal()
resource()
httpResource()
```

Do not rewrite working decorator-based code only for style unless modernization is part of the task.

### Template syntax

Use native control flow:

```html
@if (...) { ... } @else { ... }

@for (item of items(); track item.id) { ... } @empty { ... }

@switch (...) {
  @case (...) { ... }
}

@let value = expression;
```

Use a stable `track` expression. Avoid `$index` for dynamic collections.

### Change detection

Use `ChangeDetectionStrategy.OnPush` for application components.

Do not call expensive filtering, sorting, mapping or parsing methods from templates. Use `computed()` or store-derived state.

### Effects

Use `effect()` only for real side effects.

Use `computed()` for derived state.

Do not create effects that write to signals they also read unless the cycle is intentionally controlled and documented.

---

## Architecture

Organize the workspace by business capability.

Preferred structure:

```text
apps/
  <app-name>/

libs/
  <scope>/
    feature/
    ui/
    domain/
    data-access/
    util/

  shared/
    ui/
    data-access/
    util/
```

Not every feature needs every library type. Start with the smallest structure that gives clear ownership.

### Library responsibilities

#### `feature`

Contains:

- routed components
- page shells
- container components
- feature route configuration
- orchestration between stores and UI

#### `ui`

Contains:

- presentational components
- reusable display components
- UI directives and pipes
- UI-focused view models when appropriate

A UI library must not call HTTP, inject feature stores or perform navigation orchestration.

#### `domain`

Contains:

- domain types
- domain commands
- business rules
- feature state
- NgRx Signal Stores
- pure domain transformations

#### `data-access`

Contains:

- API clients
- DTOs
- adapters
- repositories
- transport error mapping
- third-party integration abstractions

Data-access services should normally be stateless.

#### `util`

Contains:

- pure helpers
- reusable validators
- functional guards
- small framework utilities

Do not use `util` as a dumping ground.

#### `shared`

Only place code in `shared` when it is genuinely reused across multiple business scopes.

Do not move feature-specific code to `shared` for speculative reuse.

---

## Nx boundaries

Use Nx tags for scope and type.

Example:

```json
{
  "tags": ["scope:projects", "type:feature"]
}
```

Recommended type tags:

```text
type:app
type:feature
type:ui
type:domain
type:data-access
type:util
```

Recommended dependency direction:

```text
app -> feature, shared
feature -> domain, data-access, ui, util, shared
domain -> data-access, util, shared
data-access -> util, shared
ui -> util, shared-ui
util -> util
```

Forbidden:

- UI depending on feature
- Domain depending on UI
- Data-access depending on feature
- Deep imports into another library
- Bypassing a library public API
- Circular dependencies
- One feature importing another feature’s private implementation

Import through public entry points only.

Good:

```ts
import { ProjectsStore } from '@workspace/projects/domain';
```

Bad:

```ts
import { ProjectsStore } from '../../../../domain/src/lib/store/projects.store';
```

---

## Domain-driven design

Use business language consistently in:

- library names
- routes
- types
- store methods
- commands
- tests
- UI labels where appropriate

Prefer intent-revealing methods:

```ts
publishProject(command)
archiveProject(projectId)
assignReviewer(command)
```

Avoid generic names:

```ts
updateData(...)
handleItem(...)
setValue(...)
processObject(...)
```

Separate DTOs from domain models when their shapes or responsibilities differ.

Preferred flow:

```text
API DTO -> adapter -> domain model -> view model
domain command -> adapter -> API request DTO
```

Do not allow backend response shapes to dictate every UI component API.

---

## Components

Use explicit container and presentational separation.

### Presentational components

A presentational component:

- receives data through `input()` or `input.required()`
- emits user intent through `output()`
- owns only local display or form state
- does not inject feature stores
- does not inject API services
- does not perform data loading
- does not navigate
- does not mutate received input objects
- uses semantic HTML
- is independently testable

Data flows down. Events flow up.

### Container components

A container component:

- injects the owning store
- reads store signals
- passes data to presentational components
- forwards emitted events to store methods
- coordinates route inputs
- contains little or no business logic
- does not call `HttpClient` directly

A container should look like wiring, not a use-case implementation.

### Shell components

A shell coordinates multiple containers or layout regions.

Do not move child business logic into the shell.

### Component inheritance

Do not use component inheritance.

Prefer composition, directives, services, host directives, utilities or reusable Signal Store features.

---

## State ownership

Use the smallest valid state lifetime.

### Component state

Use component signals for temporary state owned by one component.

Examples:

- active tab
- open/closed state
- local display mode
- temporary selection not shared elsewhere

### Form state

For new Angular 22 forms, prefer Signal Forms when the repository supports them.

Continue using typed reactive forms when:

- the existing feature already uses them
- a required control library depends on them
- migration would introduce inconsistency
- required Signal Forms capabilities are unavailable

Never use untyped forms.

### Screen state

Use a component-provided Signal Store when one page owns the state.

```ts
@Component({
  providers: [ProjectsPageStore],
})
```

Examples:

- page loading state
- filters
- selection
- local errors
- page-specific writes
- pagination

### Feature state

Use a feature-level store when multiple pages in one feature share state across navigation.

### Global state

Use root-provided state only for genuinely application-wide concerns.

Examples:

- authenticated user
- active tenant
- global preferences
- global real-time connection state

Do not put all application state into one root store.

---

## NgRx Signal Store

Use NgRx Signal Store for structured screen, feature or global state.

Use as appropriate:

```ts
signalStore()
withState()
withComputed()
withMethods()
withHooks()
withProps()
withEntities()
patchState()
rxMethod()
tapResponse()
```

Store methods must express domain or use-case intent.

Do not expose writable state to components.

Do not store values that can be computed.

Bad:

```ts
interface State {
  projects: Project[];
  projectCount: number;
}
```

Good:

```ts
withComputed(({ projects }) => ({
  projectCount: computed(() => projects().length),
}))
```

Represent complete async behavior:

- idle
- loading
- success
- empty when relevant
- expected failure
- unexpected failure

---

## Angular resources

Use `resource()` or `httpResource()` mainly for signal-driven reads when:

- one scope owns the result
- the request depends declaratively on signals
- replacing the previous read is correct
- only straightforward loading, value and error state is needed

Do not use resources blindly for all HTTP.

Prefer `HttpClient`, repositories or Signal Store methods for:

- POST
- PUT
- PATCH
- DELETE
- optimistic updates
- queued writes
- multi-step workflows
- operations requiring explicit concurrency behavior

Do not duplicate the same state in both a resource and a store without a documented reason.

---

## RxJS

Never create nested subscriptions.

Choose operators by required behavior:

- `switchMap` — replace previous reads/searches with the latest
- `concatMap` — queue operations and preserve order
- `mergeMap` — run independent operations concurrently
- `exhaustMap` — ignore repeated triggers while one operation is active

Do not choose an operator only because it is familiar.

Prefer framework-managed cleanup.

Use `takeUntilDestroyed()` for necessary imperative subscriptions.

---

## Routing

Lazy-load top-level business features.

Keep feature routes in the owning feature library.

Prefer:

- functional guards
- route inputs
- query parameters for navigational state
- `withComponentInputBinding()`

Do not duplicate URL state in a store unless the store derives additional behavior from it.

Frontend route guards improve UX but do not replace backend authorization.

---

## HTTP and data access

Use functional HTTP configuration:

```ts
provideHttpClient(
  withInterceptors([
    authenticationInterceptor,
    correlationIdInterceptor,
  ]),
);
```

Data-access services must:

- return typed values
- use DTO types at transport boundaries
- avoid holding application state
- avoid navigation
- avoid UI notifications
- avoid normal internal subscriptions
- map technical errors into application-level errors when useful

Wrap third-party clients behind application-owned abstractions when their API would otherwise spread through the codebase.

---

## Forms

A form component should own:

- field interaction
- local form state
- validation display
- submission event

Extract reusable business validation.

Emit domain-oriented commands rather than raw DOM events or anonymous objects where practical.

Client-side validation improves UX but never replaces backend validation.

---

## Error handling

Do not swallow errors.

Do not use `console.error()` as the complete error strategy.

Map technical failures to feature-level errors.

Example:

```ts
export type ProjectsError =
  | { kind: 'unauthorized' }
  | { kind: 'not-found' }
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'network' }
  | { kind: 'unexpected' };
```

UI components should not receive raw `HttpErrorResponse` objects unless they are explicitly responsible for transport-level diagnostics.

---

## SSR and hydration

When SSR is configured:

- avoid direct browser-global access during server rendering
- isolate browser-only integrations
- use Angular platform abstractions
- keep initial rendering deterministic
- use hydration and `@defer` deliberately
- test hydration-sensitive behavior

Do not directly access without protection:

```ts
window
document
localStorage
sessionStorage
navigator
```

Do not add SSR or hydration providers to a project that does not use SSR.

---

## Performance

For every feature, consider:

- route lazy loading
- `@defer`
- bundle size
- duplicate API requests
- stable `@for` tracking
- expensive computations
- unnecessary global state
- resource and cache lifetime
- image formats and dimensions
- SSR and hydration behavior
- Nx affected scope

Do not add caching without defining:

- ownership
- lifetime
- invalidation
- refresh behavior
- error behavior

---

## Accessibility

Use semantic HTML.

Do not replace buttons with clickable `div` elements.

Every interactive element must have:

- an accessible name
- keyboard support
- visible focus
- correct disabled behavior
- ARIA only where native semantics are insufficient

Loading, empty and error states must be understandable to assistive technologies.

Evaluate Angular Aria for complex accessible behavior before creating a custom implementation.

---

## Security

Never place secrets in frontend environment files.

Do not rely on hiding UI elements for authorization.

Treat backend authorization as authoritative.

Avoid:

- unsafe HTML
- bypassing Angular sanitization
- dynamic code execution
- trusting URL parameters
- trusting browser storage
- leaking backend internals to users

Treat all backend responses as untrusted input.

---

## Testing

Use Vitest and the test utilities configured by Nx.

Angular 22 tests must remain zoneless-compatible.

Do not add:

```ts
zone.js/testing
fakeAsync()
tick()
```

unless the repository explicitly uses a legacy Zone-based test environment.

Prefer:

```ts
await fixture.whenStable();
```

Use `TestBed.tick()` where supported and appropriate.

### Presentational component tests

Test:

- rendering from inputs
- emitted outputs
- user interaction
- empty states
- validation messages
- accessibility behavior

### Container tests

Test:

- store values are forwarded correctly
- user events call the correct store methods
- route inputs are connected correctly

Do not duplicate store behavior tests in container tests.

### Store tests

Test:

- initial state
- computed state
- loading transitions
- successful results
- failures
- reset behavior
- concurrency-sensitive methods
- navigation or notification side effects
- entity updates

### Data-access tests

Test:

- HTTP method
- URL
- params
- headers
- response mapping
- error mapping

### Guard tests

Test both authorized and denied access.

Do not weaken or delete tests merely to make a change pass.

---

## TDD workflow

For behavior changes:

1. Understand the requirement.
2. Define observable acceptance criteria.
3. Add or update a failing test.
4. Implement the smallest correct solution.
5. Refactor while tests remain green.
6. Run focused tests.
7. Run affected checks.
8. Review the complete diff.

Use Arrange, Act and Assert.

---

## Required implementation workflow

For a non-trivial task:

### 1. Analyze

Identify:

- business behavior
- acceptance criteria
- permissions
- loading states
- failure states
- accessibility requirements
- SSR implications
- performance implications

### 2. Inspect

Inspect:

- `package.json`
- `nx.json`
- `tsconfig.base.json`
- project tags
- module-boundary rules
- relevant libraries
- current route patterns
- stores
- tests
- public APIs

Search for an existing project pattern before inventing a new one.

### 3. Plan

Describe:

- owning scope
- affected libraries
- dependency direction
- state ownership
- resource-versus-store decision
- form approach
- test strategy
- commands to run

### 4. Test

Add or update tests that demonstrate required behavior.

### 5. Implement

Build the smallest complete vertical slice.

Do not create speculative abstractions.

### 6. Verify

Run focused targets first.

Examples:

```bash
npx nx test projects-domain
npx nx lint projects-feature
npx nx build kanmind
```

Then run:

```bash
npx nx affected -t lint,test,build --base=main
```

Use the actual package-manager syntax configured by the repository.

### 7. Review

Review the diff for:

- architecture
- duplicated state
- component responsibility
- accessibility
- security
- zoneless compatibility
- SSR compatibility
- performance
- test quality
- unnecessary complexity

---

## Completion report

At completion, report:

- what changed
- which libraries changed
- why the code belongs there
- state-lifetime decision
- resource-versus-store decision
- tests added or changed
- commands actually executed
- lint result
- test result
- build result
- remaining assumptions or risks

Never claim that a command passed unless it was actually executed successfully.
