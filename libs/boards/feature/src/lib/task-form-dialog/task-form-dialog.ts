import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BoardMember,
  BoardTask,
  BoardTaskPriority,
  BoardTaskStatus,
  BoardsMutationStatus,
  SaveBoardTaskCommand,
} from '@kanmind/boards/domain';

@Component({
  selector: 'lib-task-form-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialog implements OnInit {
  readonly mode = input.required<'create' | 'edit'>();
  readonly task = input.required<BoardTask | null>();
  readonly members = input.required<readonly BoardMember[]>();
  readonly initialStatus = input.required<BoardTaskStatus>();
  readonly mutationStatus = input.required<BoardsMutationStatus>();

  readonly closed = output<void>();
  readonly saved = output<SaveBoardTaskCommand>();
  readonly deleted = output<void>();
  readonly submitted = signal(false);

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(64)],
    }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<BoardTaskStatus>('to-do', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<BoardTaskPriority>('medium', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    assigneeId: new FormControl<number | null>(null),
    reviewerId: new FormControl<number | null>(null),
    dueDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    const task = this.task();
    this.form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? this.initialStatus(),
      priority: task?.priority ?? 'medium',
      assigneeId: task?.assignee?.id ?? null,
      reviewerId: task?.reviewer?.id ?? null,
      dueDate: task?.dueDate ?? '',
    });
  }

  submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saved.emit(this.form.getRawValue());
  }
}
