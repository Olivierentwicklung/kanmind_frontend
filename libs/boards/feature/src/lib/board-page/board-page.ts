import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@kanmind/auth/domain';
import { BoardStore } from '@kanmind/boards/domain';
import { AppShell } from '@kanmind/shared/ui';
import { BoardSettingsDialog } from '../board-settings-dialog/board-settings-dialog';
import { BoardView } from '../board-view/board-view';
import { TaskDetailDialog } from '../task-detail-dialog/task-detail-dialog';
import { TaskFormDialog } from '../task-form-dialog/task-form-dialog';

@Component({
  selector: 'lib-board-page',
  imports: [
    BoardSettingsDialog,
    BoardView,
    AppShell,
    RouterLink,
    TaskDetailDialog,
    TaskFormDialog,
  ],
  providers: [BoardStore],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  readonly id = input<string>();
  readonly task_id = input<string>();
  readonly store = inject(BoardStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private requestedTaskId: number | null = null;

  constructor() {
    effect(() => {
      const boardId = this.toPositiveInteger(this.id());
      this.requestedTaskId = null;

      if (boardId === null) {
        void this.router.navigate(['/boards']);
        return;
      }

      this.store.loadBoard(boardId);
    });

    effect(() => {
      if (this.store.deleted()) {
        void this.router.navigate(['/boards']);
      }
    });

    effect(() => {
      const taskId = this.toPositiveInteger(this.task_id());
      if (
        taskId !== null &&
        this.requestedTaskId !== taskId &&
        this.store.status() === 'success' &&
        this.store.board()?.tasks.some((task) => task.id === taskId)
      ) {
        this.requestedTaskId = taskId;
        this.store.openTask(taskId);
      }
    });
  }

  private toPositiveInteger(value: string | undefined): number | null {
    const parsedValue = Number(value);
    return Number.isInteger(parsedValue) && parsedValue > 0
      ? parsedValue
      : null;
  }
}
