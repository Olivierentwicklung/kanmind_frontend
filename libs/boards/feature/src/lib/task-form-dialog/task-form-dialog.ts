import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import {
  BoardMember,
  BoardTask,
  BoardTaskPriority,
  BoardTaskStatus,
  BoardsMutationStatus,
  SaveBoardTaskCommand,
} from '@kanmind/boards/domain';
import { DialogFocusDirective } from '../dialog-focus/dialog-focus.directive';

interface TaskFormModel {
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  assigneeId: string;
  reviewerId: string;
  dueDate: string;
}

const initialTaskFormModel: TaskFormModel = {
  title: '',
  description: '',
  status: 'to-do',
  priority: 'medium',
  assigneeId: '',
  reviewerId: '',
  dueDate: '',
};

@Component({
  selector: 'lib-task-form-dialog',
  imports: [FormField, FormRoot, DialogFocusDirective],
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

  readonly taskModel = signal<TaskFormModel>(initialTaskFormModel);
  readonly taskForm = form(this.taskModel, (fields) => {
    required(fields.title);
    minLength(fields.title, 3);
    maxLength(fields.title, 64);
    required(fields.status);
    required(fields.priority);
    required(fields.dueDate);
  });

  ngOnInit(): void {
    const task = this.task();
    this.taskModel.set({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? this.initialStatus(),
      priority: task?.priority ?? 'medium',
      assigneeId: task?.assignee?.id.toString() ?? '',
      reviewerId: task?.reviewer?.id.toString() ?? '',
      dueDate: task?.dueDate ?? '',
    });
  }

  submit(): void {
    this.submitted.set(true);
    this.taskForm().markAsTouched();
    if (this.taskForm().invalid()) return;

    const value = this.taskModel();
    this.saved.emit({
      ...value,
      assigneeId: this.toMemberId(value.assigneeId),
      reviewerId: this.toMemberId(value.reviewerId),
    });
  }

  private toMemberId(value: string): number | null {
    if (value === '') return null;
    const memberId = Number(value);
    return Number.isInteger(memberId) ? memberId : null;
  }
}
