---
name: angular-component
description: Create or refactor KanMind standalone Angular shell, container, presentational, or form components. Use when deciding component ownership, signal inputs/outputs, local UI state, Signal Forms, route wiring, or component tests.
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
- own only local display, form, or focus state
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
  readonly projects = input.required<readonly ProjectCardViewModel[]>();

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

## Form component rules

Use `@angular/forms/signals` when it supports the required behavior. Keep the
model signal, field interaction, validation display, and touched state in the
form component.

A form component must:

- mark invalid submissions as touched
- expose loading and disabled behavior with native semantics
- emit a typed domain command or normalized value
- display mapped backend validation errors without exposing transport details

Use typed reactive forms only for a documented integration or explicitly
scoped legacy exception. Do not use untyped forms.

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
