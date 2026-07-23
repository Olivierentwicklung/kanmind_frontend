import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  BoardDetail,
  BoardTask,
  BoardTaskStatus,
} from '@kanmind/boards/domain';

interface BoardColumn {
  status: BoardTaskStatus;
  label: string;
}

@Component({
  selector: 'lib-board-view',
  templateUrl: './board-view.html',
  styleUrl: './board-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardView {
  readonly board = input.required<BoardDetail>();
  readonly tasksByStatus =
    input.required<Record<BoardTaskStatus, readonly BoardTask[]>>();

  readonly searchChanged = output<string>();
  readonly createTaskRequested = output<BoardTaskStatus>();
  readonly taskSelected = output<number>();
  readonly taskMoved =
    output<{ taskId: number; status: BoardTaskStatus }>();
  readonly settingsRequested = output<void>();

  readonly columns: readonly BoardColumn[] = [
    { status: 'to-do', label: 'To-do' },
    { status: 'in-progress', label: 'In-progress' },
    { status: 'review', label: 'Review' },
    { status: 'done', label: 'Done' },
  ];

  initials(fullName: string): string {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase())
      .join('');
  }

  previousStatus(status: BoardTaskStatus): BoardTaskStatus | null {
    const index = this.columns.findIndex((column) => column.status === status);
    return index > 0 ? this.columns[index - 1].status : null;
  }

  nextStatus(status: BoardTaskStatus): BoardTaskStatus | null {
    const index = this.columns.findIndex((column) => column.status === status);
    return index < this.columns.length - 1
      ? this.columns[index + 1].status
      : null;
  }

  statusLabel(status: BoardTaskStatus): string {
    return this.columns.find((column) => column.status === status)?.label ?? status;
  }
}
