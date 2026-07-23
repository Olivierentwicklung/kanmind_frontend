import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BoardTask,
  BoardTaskStatus,
  BoardsLoadStatus,
  BoardsMutationStatus,
  TaskComment,
} from '@kanmind/boards/domain';
import { DialogFocusDirective } from '../dialog-focus/dialog-focus.directive';

@Component({
  selector: 'lib-task-detail-dialog',
  imports: [DatePipe, ReactiveFormsModule, DialogFocusDirective],
  templateUrl: './task-detail-dialog.html',
  styleUrl: './task-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailDialog {
  readonly task = input.required<BoardTask>();
  readonly comments = input.required<readonly TaskComment[]>();
  readonly currentUserName = input.required<string>();
  readonly commentStatus = input.required<BoardsLoadStatus>();
  readonly mutationStatus = input.required<BoardsMutationStatus>();

  readonly closed = output<void>();
  readonly editRequested = output<void>();
  readonly statusChanged = output<BoardTaskStatus>();
  readonly commentAdded = output<string>();
  readonly commentDeleted = output<number>();

  readonly comment = new FormControl('', { nonNullable: true });

  initials(fullName: string): string {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase())
      .join('');
  }

  submitComment(): void {
    const content = this.comment.value.trim();
    if (!content) return;
    this.commentAdded.emit(content);
    this.comment.reset();
  }

  onCommentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitComment();
    }
  }
}
