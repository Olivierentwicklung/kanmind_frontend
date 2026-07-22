---
name: angular-signal-store
description: Use when creating, changing or reviewing NgRx Signal Store state, methods, computed values or async workflows.
---

# NgRx Signal Store Workflow

## 1. Determine ownership and lifetime

Ask:

- Which components consume this state?
- Which components mutate it?
- Must it survive route changes?
- Is it URL state?
- Is it temporary UI state?

Choose:

- component signal for isolated temporary UI state
- resource for straightforward signal-driven reads
- component-provided store for one page
- feature store for several pages in one feature
- root store only for application-wide state

Do not create a root store by default.

## 2. Define explicit state

Represent the full UI lifecycle.

```ts
type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ProjectsState {
  projects: readonly Project[];
  selectedProjectId: ProjectId | null;
  loadStatus: LoadStatus;
  error: ProjectsError | null;
}
```

Do not duplicate computed values in state.

## 3. Add computed state

Use `withComputed` for:

- selected entity
- counts
- filtered collections
- permission flags
- loading and empty flags

```ts
withComputed((store) => ({
  selectedProject: computed(() => {
    const id = store.selectedProjectId();
    return store.projects().find(project => project.id === id) ?? null;
  }),
}))
```

## 4. Add synchronous methods

Use intent-revealing names and immutable updates.

Good:

```ts
selectProject(id)
clearSelection()
applySearch(query)
```

Bad:

```ts
setData(...)
updateState(...)
handleValue(...)
```

## 5. Add asynchronous methods

Use `rxMethod` and select concurrency deliberately.

- `switchMap` for replaceable reads
- `concatMap` for queued ordered writes
- `mergeMap` for independent concurrent work
- `exhaustMap` for duplicate-proof submissions

Set loading state before the request.

Use `tapResponse` for success and failure.

```ts
loadProjects: rxMethod<void>(
  pipe(
    tap(() =>
      patchState(store, {
        loadStatus: 'loading',
        error: null,
      }),
    ),
    switchMap(() =>
      projectsApi.getProjects().pipe(
        tapResponse({
          next: projects =>
            patchState(store, {
              projects,
              loadStatus: 'success',
            }),
          error: error =>
            patchState(store, {
              loadStatus: 'error',
              error: mapProjectsError(error),
            }),
        }),
      ),
    ),
  ),
)
```

## 6. Dependencies

The store may inject:

- data-access abstractions
- router when navigation completes a use case
- notification abstraction
- clock, ID or platform abstractions

The store must not depend on:

- presentational components
- DOM APIs
- concrete third-party clients when an internal abstraction exists

## 7. Provide at the correct scope

Screen-local:

```ts
@Component({
  providers: [ProjectsPageStore],
})
```

Global only when justified:

```ts
export const AuthStore = signalStore(
  { providedIn: 'root' },
  // ...
);
```

## 8. Test

Test:

- initial state
- each computed value
- loading transition
- successful result
- failed result
- reset behavior
- concurrency-sensitive behavior
- entity changes
- navigation or notification side effects

Mock the data-access abstraction, not HttpClient internals, when testing the store.

## Checklist

- [ ] State scope is justified.
- [ ] No derived-state duplication.
- [ ] No writable state is exposed.
- [ ] Loading and failure are represented.
- [ ] RxJS operator matches business semantics.
- [ ] Components do not orchestrate data access.
- [ ] Store tests cover transitions.
