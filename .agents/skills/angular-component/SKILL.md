---
name: angular-component
description: Use when creating or refactoring Angular shell, container, presentational or form components.
---

# Angular Component Structure

## First classify the component

Choose one:

- shell
- container
- presentational
- form
- layout

Do not mix responsibilities without a documented reason.

## Presentational component rules

A presentational component must:

- be standalone
- use `ChangeDetectionStrategy.OnPush`
- receive data through signal inputs
- emit user intent through outputs
- avoid store and API injection
- avoid routing orchestration
- avoid shared-state mutation
- own only local display or form state
- use semantic HTML
- remain independently testable

Example:

```ts
@Component({
  selector: 'app-project-list',
  standalone: true,
  templateUrl: './project-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectList {
  readonly projects =
    input.required<readonly ProjectCardViewModel[]>();

  readonly selected = output<ProjectId>();
  readonly deleted = output<ProjectId>();
}
```

## Container component rules

A container component must:

- inject the owning store
- read store signals
- pass data to presentational components
- forward UI events to store methods
- coordinate route inputs
- avoid direct HTTP calls
- contain no business calculations

Example:

```ts
@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [ProjectList],
  providers: [ProjectsPageStore],
  template: `
    <app-project-list
      [projects]="store.projectCards()"
      (selected)="store.selectProject($event)"
      (deleted)="store.deleteProject($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  readonly store = inject(ProjectsPageStore);
}
```

## Keep logic in the component only when it is tied to

- rendering
- form interaction
- focus
- animation
- element measurement
- temporary display state

Move logic out when it:

- contains business rules
- coordinates APIs
- changes shared state
- can be tested without rendering a template
- is reused elsewhere

## Tests

Presentational tests:

- input rendering
- emitted events
- user interaction
- accessibility
- empty and error display
- local validation

Container tests:

- state binding
- event forwarding
- route-input wiring

Do not duplicate store behavior tests in container tests.
