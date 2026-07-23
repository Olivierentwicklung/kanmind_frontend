import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
export class BoardPage implements OnInit {
  readonly store = inject(BoardStore);
  readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private requestedTaskOpened = false;

  constructor() {
    effect(() => {
      if (this.store.deleted()) {
        void this.router.navigate(['/boards']);
      }
    });

    effect(() => {
      const taskId = Number(this.route.snapshot.queryParamMap.get('task_id'));
      if (
        !this.requestedTaskOpened &&
        Number.isInteger(taskId) &&
        taskId > 0 &&
        this.store.status() === 'success' &&
        this.store.board()?.tasks.some((task) => task.id === taskId)
      ) {
        this.requestedTaskOpened = true;
        this.store.openTask(taskId);
      }
    });
  }

  ngOnInit(): void {
    const boardId = Number(this.route.snapshot.queryParamMap.get('id'));
    if (Number.isInteger(boardId) && boardId > 0) {
      this.store.loadBoard(boardId);
    } else {
      void this.router.navigate(['/boards']);
    }
  }
}
