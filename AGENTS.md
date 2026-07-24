# KanMind Frontend — Codex Engineering Policy

## 1. Scope and authority

This file defines the engineering rules for the `kanmind-frontend` workspace.
Read it before planning, reviewing, or changing repository files.

More specific `AGENTS.md` files override this file for their directory trees.
Task instructions from the user take precedence when they explicitly conflict
with this policy.

Repeatable implementation and review procedures live in `.agents/skills/`.
Use a Skill when the task matches its description, but do not treat Skills as a
substitute for inspecting the current repository.

Long-form project and migration documentation belongs in `README.md` and
`docs/`, not in this policy.

## 2. Verified workspace baseline

Use the versions installed in `package.json` and `package-lock.json`. Do not
upgrade, downgrade, or replace them unless the task explicitly requires it.

| Area | Current repository configuration |
| --- | --- |
| Workspace package | `kanmind-frontend` |
| Package manager | npm |
| Main branch | `main` |
| Primary app | `kanmind` |
| Browser-test app | `kanmind-e2e` |
| Angular | `~22.0.4` |
| Nx | `23.1.0` |
| TypeScript | `~6.0.3`, strict mode |
| NgRx Signal Store | `^22.0.0-beta.0` |
| RxJS | `~7.8.0` |
| Unit/integration tests | Vitest, Angular build test executor, Angular Testing Library |
| Browser tests | Playwright |
| Styling | CSS; no Tailwind configuration |
| API base path | `/api/` |
| CI Node runtime | Node 24 |

Node 24 is verified in `.github/workflows/ci.yml`; the package does not declare
an `engines` requirement. Do not describe Node 24 as an npm-enforced constraint.

The app is client-rendered. No SSR server target, hydration provider, or SSR
entry point is configured.

## 3. Current projects and ownership

```text
apps/
  kanmind/                  application composition root
  kanmind-e2e/              Playwright browser journeys

libs/
  auth/
    feature/                login and registration pages/forms/routes
    domain/                 session models, root AuthStore, auth guard
    data-access/            API, repository, storage, interceptor
  legal/
    feature/                privacy and imprint pages/routes
  dashboard/
    feature/                dashboard page and presentational UI
    domain/                 DashboardStore and dashboard models
    data-access/            dashboard API and repository
  boards/
    feature/                board collection/detail pages and dialogs
    domain/                 BoardsStore, BoardStore, board/task models
    data-access/            board/task/comment API and repository
  shared/
    ui/                     reusable AppShell only
```

Current Nx project names:

```text
kanmind-frontend
kanmind
kanmind-e2e
auth-feature
auth-domain
auth-data-access
legal-feature
dashboard-feature
dashboard-domain
dashboard-data-access
boards-feature
boards-domain
boards-data-access
shared-ui
```

`kanmind-frontend` is Nx's package-root project inferred from the root npm
scripts. It is tagged `npm:private`, is not a business library/application
boundary, and is explicitly excluded by the configured `affected` script. The
other 13 projects are the application, E2E, and library projects governed by
the scope/type rules below.

Do not create a library merely to complete a theoretical
`feature/domain/data-access/ui/util` matrix. Add a boundary only when it has a
clear owner, responsibility, consumer, and dependency direction.

## 4. Canonical commands

Prefer the checked-in npm scripts over reconstructed Nx commands.

```bash
npm start
npm run build
npm run lint
npm run test:unit
npm run test:integration
npm test
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
npm run test:all
npm run affected
```

Command semantics:

- `npm test` runs unit and integration groups.
- `npm run test:all` runs lint, unit/integration tests, E2E, then production
  build.
- `npm run affected` runs the exact affected command configured in
  `package.json` against `main`.
- `npm run build` builds `kanmind` in production mode by default.
- `npm start` serves the Angular app and uses `apps/kanmind/proxy.conf.json` in
  development.

There is no package script for formatting or standalone type checking.
Formatting uses the checked-in Prettier configuration when a formatting check
is relevant. TypeScript compilation is exercised by test/build targets.

The current CI workflow runs lint, unit tests, integration tests, and E2E tests
as separate jobs. It does not currently run the production build. Do not report
CI build coverage unless the workflow changes.

Run focused Nx targets when useful, using real project names:

```bash
npx nx test auth-domain
npx nx test boards-feature
npx nx lint dashboard-domain
npx nx build kanmind
```

On Windows PowerShell, use `npm.cmd` or `npx.cmd` if script execution policy
blocks the `.ps1` shims.

## 5. Nx boundaries and public APIs

Every project must retain both a scope tag and a type tag.

Current scopes:

```text
scope:app
scope:auth
scope:legal
scope:dashboard
scope:boards
scope:shared
```

Current types:

```text
type:app
type:e2e
type:feature
type:domain
type:data-access
type:ui
```

`eslint.config.mjs` is authoritative. Its enforced type rules are:

```text
type:app         -> type:feature, type:domain, type:data-access, type:ui
type:e2e         -> type:app
type:feature     -> type:domain, type:data-access, type:ui
type:domain      -> type:data-access
type:data-access -> no workspace library type
type:ui          -> type:ui, type:util
```

There is no current `type:util` project, although the boundary rule permits the
tag for a justified future library.

The enforced scope rules are:

```text
scope:app       -> app, auth, legal, dashboard, boards, shared
scope:auth      -> auth, shared
scope:legal     -> legal, auth, shared
scope:dashboard -> dashboard, auth, shared
scope:boards    -> boards, auth, shared
scope:shared    -> shared
```

The type and scope constraints both apply. Do not weaken them to make an import
pass. Fix ownership or dependency direction instead.

Import cross-library symbols only from configured public APIs:

```ts
import { AuthStore } from '@kanmind/auth/domain';
import { BoardsRepository } from '@kanmind/boards/data-access';
import { AppShell } from '@kanmind/shared/ui';
```

Configured aliases are:

```text
@kanmind/auth/domain
@kanmind/auth/data-access
@kanmind/auth/feature
@kanmind/legal/feature
@kanmind/dashboard/domain
@kanmind/dashboard/data-access
@kanmind/dashboard/feature
@kanmind/boards/domain
@kanmind/boards/data-access
@kanmind/boards/feature
@kanmind/shared/ui
```

Never deep-import another library's `src/lib` implementation. Keep each
`src/index.ts` minimal and intentional.

## 6. Angular application rules

### Standalone and zoneless

The application uses `bootstrapApplication`, `ApplicationConfig`, standalone
components/directives, and zoneless change detection.

- Create new Angular declarations as standalone.
- Use functional providers, guards, interceptors, and route configuration.
- Use `ChangeDetectionStrategy.OnPush` for application components.
- Do not create an NgModule unless a required third-party integration cannot be
  configured otherwise.
- Do not add `zone.js`, `zone.js/testing`,
  `provideZoneChangeDetection()`, or `provideZonelessChangeDetection()` as a
  rendering/test workaround.

### Signals and templates

Prefer the signal APIs already used by the repository:

```text
signal
computed
input
input.required
output
effect (only for genuine side effects)
```

Use native template control flow (`@if`, `@for`, `@switch`, `@let`). Track
dynamic collections by stable identity, not `$index`.

Do not call expensive filtering, sorting, parsing, or mapping methods from
templates. Derive view state with `computed()` or store computed signals.

Do not modernize working code solely for stylistic consistency unless the task
includes modernization.

### Component responsibilities

Presentational components:

- receive data through signal inputs;
- emit user intent through outputs;
- own only display/form/focus state;
- do not inject feature stores, repositories, API services, or `Router`;
- do not mutate received objects;
- use semantic HTML and remain independently testable.

Page/container components:

- provide/inject the owning screen store;
- translate route inputs into store actions;
- pass signals to child components;
- forward child intent to store methods;
- do not call `HttpClient` or implement business calculations.

Shell/layout components coordinate shared layout only. `shared-ui` must not own
auth, dashboard, or boards use cases.

Do not use component inheritance. Prefer composition, directives, services, or
small pure helpers.

## 7. Routing

`apps/kanmind/src/app/app.routes.ts` is the application route composition root.
Current behavior:

- the empty path uses `landingRedirect`;
- `/login` and `/register` lazy-load auth route arrays;
- legal routes are lazy-loaded from `legal-feature`;
- `/dashboard`, `/boards`, and `/board` are protected by `authGuard`;
- `/board` uses query parameters for board/task navigation;
- unknown routes render the accessible not-found component.

Keep top-level business routes lazy. Feature route definitions belong in their
feature libraries.

Prefer route inputs and query parameters for navigational state. The app is
configured with `withComponentInputBinding()`. Do not duplicate URL state in a
store unless the store derives additional behavior from it.

Frontend guards improve navigation UX; backend authorization remains
authoritative.

## 8. State ownership and NgRx Signal Store

Use the smallest valid state lifetime.

| State kind | Repository decision |
| --- | --- |
| Local display/form/focus state | component signals or Signal Forms |
| Dashboard screen state | page-provided `DashboardStore` |
| Boards collection state | page-provided `BoardsStore` |
| Board detail/task state | page-provided `BoardStore` |
| Cross-route authenticated session | root-provided `AuthStore` |

Do not make a store root-provided merely for injection convenience.

For structured state:

- use `signalStore`, `withState`, `withComputed`, `withMethods`, `withHooks`
  where the use case requires them;
- keep writable state internal;
- use intent-revealing methods;
- compute derived counts, selections, filtering, and status views;
- represent idle/loading/success/error and empty or mutation states where
  relevant;
- inject repositories rather than low-level API services into domain stores;
- keep DOM APIs out of stores.

Angular `resource()` and `httpResource()` are not current application patterns.
Introducing either requires a documented ownership and lifecycle decision.
Do not duplicate the same result in a resource and a store.

## 9. RxJS concurrency

Never create nested subscriptions. Choose operators from use-case semantics:

- `switchMap`: replaceable reads, searches, or route-dependent loads;
- `concatMap`: ordered writes such as task moves, comments, or membership
  changes;
- `mergeMap`: independent concurrent work only when order and cancellation do
  not matter;
- `exhaustMap`: ignore duplicate submissions/deletions while one is active;
- `forkJoin`: finite independent reads that must complete together.

The current stores deliberately use these distinctions. Preserve them unless a
behavior change requires different concurrency.

Set loading/mutation state before requests and map both success and failure.
Use framework-managed cleanup; use `takeUntilDestroyed()` for necessary
imperative subscriptions.

## 10. Forms

Signal Forms are the current repository standard. Active forms use
`@angular/forms/signals`, model signals, `form()`, `FormField`, and validators.

For new forms:

- use Signal Forms when the required capability exists;
- keep field interaction, local form state, and validation display in the form
  component;
- mark invalid submissions as touched;
- expose loading/disabled behavior correctly;
- emit domain-oriented commands or typed values;
- normalize input at a clearly tested boundary;
- keep server validation authoritative and map backend field errors.

Use typed reactive forms only when a required integration lacks Signal Forms
support or consistency with an explicitly scoped legacy feature requires it.
Document that exception. Never use untyped forms.

## 11. HTTP, repositories, storage, and errors

The application config uses:

```ts
provideHttpClient(withInterceptors([authenticationInterceptor]));
```

Transport responsibilities:

- API services define typed HTTP methods and DTOs.
- Repositories adapt DTOs to domain models and technical failures to
  application errors.
- Domain stores orchestrate use cases through repositories.
- Components do not inject `HttpClient`, API services, or repositories.

Data-access services must remain stateless except for explicit platform
abstractions such as `SessionStorage`.

The current authentication storage contract uses:

```text
auth-token
auth-user-id
auth-email
auth-fullname
```

Access browser storage through the data-access abstraction. Do not spread
`localStorage` or `sessionStorage` access through components/stores.

Do not swallow errors or use `console.error()` as the complete error strategy.
UI-facing state should receive domain/application errors, not raw
`HttpErrorResponse` objects.

## 12. Styling and static assets

- Use CSS; Tailwind is not installed or configured.
- New styling frameworks require explicit approval.
- Global CSS is loaded from `apps/kanmind/src/styles.css`.
- Preserved global styles live under `apps/kanmind/src/styles/legacy`.
- Fonts and icons live under `apps/kanmind/src/assets` and are copied by the
  Angular build.
- Component-specific styling belongs with the component.

Do not rename or rewrite preserved CSS merely to hide its legacy origin. Remove
or modernize it only with visual/regression evidence.

## 13. SSR and browser APIs

SSR and hydration are not configured. Do not add SSR/hydration providers,
targets, or platform branches unless the task explicitly introduces SSR.

Even in the client-rendered app, isolate direct access to:

```text
window
document
localStorage
sessionStorage
navigator
```

Use Angular/platform abstractions or application-owned services/directives.
Direct DOM access is acceptable only for focused UI behavior such as the tested
dialog focus directive, not for business state or rendering.

## 14. Testing policy

Use the configured Vitest, Angular Testing Library, Angular HTTP testing tools,
and Playwright setup. Tests must remain zoneless-compatible.

Do not add:

```ts
import 'zone.js/testing';
fakeAsync(...);
tick(...);
```

Prefer semantic Testing Library and Playwright queries. Use
`await fixture.whenStable()` or supported `TestBed.tick()` behavior when
necessary.

### Test ownership

- **Data-access tests:** method, URL, query, headers, body, DTO mapping, error
  mapping, interceptor/storage behavior.
- **Store tests:** initial/computed state, loading, success, failure, reset,
  mutations, concurrency-sensitive behavior, navigation side effects.
- **Guard tests:** authenticated and denied access.
- **Presentational/form tests:** input rendering, outputs, validation, keyboard
  interaction, loading/empty/error/accessibility behavior.
- **Container/page tests:** store-to-child bindings, event forwarding, route
  inputs, navigation; do not duplicate store behavior.
- **Playwright tests:** complete user journeys, route/storage/wire contracts,
  responsive behavior, and cross-component workflows.

Current package grouping:

```text
test:unit
  auth-domain, auth-data-access
  dashboard-domain, dashboard-data-access
  boards-domain, boards-data-access

test:integration
  kanmind, auth-feature, legal-feature
  dashboard-feature, boards-feature, shared-ui
```

The E2E config runs desktop Chromium and Pixel 5 emulation, mocks the backend
per scenario, and starts `kanmind` at `http://127.0.0.1:4200`.

Do not delete or weaken a test to make implementation pass. Update expectations
only when an intentional behavior change is supported by acceptance criteria.

## 15. TDD and implementation workflow

For behavior changes:

1. Understand the requested behavior and identify observable acceptance
   criteria.
2. Inspect the current implementation, related tests, and analogous patterns.
3. Add or update a test that demonstrates the missing/changed behavior where
   practical.
4. Implement the smallest correct change.
5. Refactor while focused tests remain green.
6. Run focused checks.
7. Run the proportionate repository checks.
8. Review the complete diff.

For a non-trivial task, do not edit before presenting a concise plan.

### Analyze

Identify:

- business behavior and non-goals;
- permissions and route behavior;
- loading, empty, error, and duplicate-action behavior;
- API/storage/URL contracts;
- accessibility, security, and performance implications.

### Inspect

At minimum inspect the relevant subset of:

- `package.json`, `nx.json`, `tsconfig.base.json`;
- project `project.json` and tags;
- `eslint.config.mjs` boundaries;
- app and feature routes;
- public `src/index.ts` APIs;
- components, stores, repositories, forms, and tests;
- existing project patterns before creating a new abstraction.

### Plan

State:

- owning scope and affected projects;
- dependency direction and public API changes;
- component responsibilities;
- state lifetime and resource-versus-store decision;
- form and RxJS concurrency decisions;
- test strategy and exact commands;
- assumptions, risks, and rollback where material.

### Implement

- keep the change within the requested scope;
- preserve unrelated working-tree changes;
- do not create speculative abstractions;
- do not bypass architecture or tests for speed;
- do not change package/config files unless the task requires it.

### Verify

Run focused checks first. Then choose the smallest sufficient repository gate:

- documentation/config-only: formatting/reference validation and relevant lint;
- isolated library change: project test and lint;
- feature behavior: focused tests plus relevant integration/E2E;
- architecture/config/dependency change: lint, affected checks, and build;
- release/final migration gate: `npm run test:all`.

Do not run destructive cleanup or delete caches merely to obtain a green result.
Do not claim a command passed unless it completed successfully in the current
work.

### Review

Review the complete diff for:

- correctness and edge cases;
- project ownership and public API use;
- component/store/repository responsibilities;
- duplicated or incorrectly scoped state;
- RxJS concurrency;
- zoneless compatibility;
- accessibility and security;
- duplicate requests, bundle/style impact, and unnecessary complexity;
- test quality rather than coverage count alone.

## 16. Accessibility

Use semantic HTML and native controls.

Every interactive element must have:

- an accessible name;
- keyboard support;
- visible focus;
- correct disabled semantics;
- ARIA only when native semantics are insufficient.

Dialogs must manage initial focus, keyboard closing/containment, background
interaction, and focus restoration. Reuse the tested dialog-focus behavior
where its ownership fits.

Loading, empty, validation, and error states must be understandable to assistive
technology. Preserve the mobile no-horizontal-overflow behavior covered by
Playwright.

Angular Aria is not installed. Adding it or another accessibility dependency
requires an explicit dependency decision; do not assume it is available.

## 17. Security

- Never store secrets in frontend source or environment files.
- Treat backend authorization as authoritative.
- Do not trust route parameters, browser storage, or backend response content.
- Validate and map data at boundaries.
- Do not use dynamic code execution.
- Do not bypass Angular sanitization or introduce unsafe HTML without a
  reviewed, narrowly justified requirement.
- Do not expose backend internals or raw technical errors to users.
- Preserve the functional authentication interceptor and Token authorization
  contract unless the backend contract intentionally changes.

## 18. Performance

For relevant changes, review:

- route lazy loading;
- production build budgets;
- duplicate API calls;
- replaceable-request cancellation;
- stable `@for` tracking;
- expensive template/computed work;
- unnecessary root state;
- image format/dimensions;
- CSS growth and component-style budgets;
- affected project scope.

Current production budgets:

```text
initial bundle warning: 500 kB
initial bundle error:   1 MB
component style warning: 4 kB
component style error:   8 kB
```

Do not add caching without defining ownership, lifetime, invalidation, refresh,
and error behavior. Do not add `@defer` or memoization without an evidenced
performance or loading-boundary benefit.

## 19. Completion reporting

Every completed task must report:

- outcome and behavior changed;
- files/projects changed and why they own the change;
- state lifetime, resource/store, form, and concurrency decisions when
  applicable;
- tests added or changed;
- exact commands executed and their actual results;
- lint, test, and build status, including “not run” with a reason;
- assumptions, warnings, unresolved risks, and follow-up work.

For review-only or documentation-only work, explicitly state that application
state/resource/form decisions were not applicable rather than inventing them.

Never:

- claim unexecuted checks passed;
- claim access to deleted or unavailable conversations;
- present inference as repository fact;
- hide warnings that affect the requested work.

## 20. Policy maintenance

Update this file when installed versions, project names, aliases, boundaries,
state/form conventions, canonical scripts, CI gates, SSR status, or ownership
change.

Review it with architecture-affecting package/Nx upgrades and at least once per
quarter while the project is active. The engineering owner or maintainer
responsible for the affected scope should review policy changes.

Repository risk: `.gitignore` currently ignores `/AGENTS.md`, `/.agents/`, and
`/CODEX-USAGE-GUIDE.md`. This means local policy changes are not visible in
normal Git status or shared automatically. Do not claim these files are tracked.
If the team wants this policy to be durable across contributors, explicitly
remove those ignore entries and commit the files in a separately approved
governance change.

The explicit `@nx/eslint:lint` project targets are valid for the installed Nx
23 workspace but emit an Nx 24 deprecation warning. Convert them to inferred
targets only as a deliberate Nx maintenance task, not as incidental cleanup.
