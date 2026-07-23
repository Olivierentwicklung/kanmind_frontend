import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  BoardDetail,
  BoardTask,
  BoardTaskStatus,
} from '@kanmind/boards/domain';

interface BoardColumn {
  status: BoardTaskStatus;
  label: string;
}

interface BoardTaskViewModel {
  task: BoardTask;
  assigneeInitials: string | null;
  previous: BoardColumn | null;
  next: BoardColumn | null;
}

interface BoardColumnViewModel extends BoardColumn {
  tasks: readonly BoardTaskViewModel[];
}

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase())
    .join('');
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
  readonly taskMoved = output<{ taskId: number; status: BoardTaskStatus }>();
  readonly settingsRequested = output<void>();

  private readonly columns: readonly BoardColumn[] = [
    { status: 'to-do', label: 'To-do' },
    { status: 'in-progress', label: 'In-progress' },
    { status: 'review', label: 'Review' },
    { status: 'done', label: 'Done' },
  ];

  readonly visibleMembers = computed(() =>
    this.board()
      .members.slice(0, 4)
      .map((member) => ({
        ...member,
        initials: initials(member.fullName),
      })),
  );
  readonly remainingMemberCount = computed(() =>
    Math.max(0, this.board().members.length - 4),
  );
  readonly columnViewModels = computed<readonly BoardColumnViewModel[]>(() =>
    this.columns.map((column, index) => ({
      ...column,
      tasks: this.tasksByStatus()[column.status].map((task) => ({
        task,
        assigneeInitials: task.assignee
          ? initials(task.assignee.fullName)
          : null,
        previous: index > 0 ? this.columns[index - 1] : null,
        next: index < this.columns.length - 1 ? this.columns[index + 1] : null,
      })),
    })),
  );
}
