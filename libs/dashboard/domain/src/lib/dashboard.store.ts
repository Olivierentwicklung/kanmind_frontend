import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  DashboardApi,
  DashboardBoardDto,
  DashboardTaskDto,
} from '@kanmind/dashboard/data-access';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, forkJoin, pipe, switchMap, tap } from 'rxjs';
import {
  DashboardBoard,
  DashboardContext,
  DashboardError,
  DashboardLoadStatus,
  DashboardTask,
  DashboardTaskMode,
  TaskStatusCount,
} from './dashboard.models';

interface DashboardState {
  context: DashboardContext | null;
  boards: readonly DashboardBoard[];
  assignedTasks: readonly DashboardTask[];
  reviewerTasks: readonly DashboardTask[];
  taskMode: DashboardTaskMode;
  status: DashboardLoadStatus;
  taskInsightsStatus: DashboardLoadStatus;
  error: DashboardError | null;
}

const initialState: DashboardState = {
  context: null,
  boards: [],
  assignedTasks: [],
  reviewerTasks: [],
  taskMode: 'assigned',
  status: 'idle',
  taskInsightsStatus: 'idle',
  error: null,
};

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function toBoard(dto: DashboardBoardDto): DashboardBoard {
  return { id: dto.id, title: dto.title, ownerId: dto.owner_id };
}

function toTask(dto: DashboardTaskDto): DashboardTask {
  return {
    id: dto.id,
    boardId: dto.board,
    title: dto.title,
    dueDate: dto.due_date,
    priority: dto.priority,
    status: dto.status,
    commentsCount: dto.comments_count,
    assignee: dto.assignee
      ? {
          id: dto.assignee.id,
          fullName: dto.assignee.fullname,
          initials: initials(dto.assignee.fullname),
        }
      : null,
  };
}

function toDashboardError(error: unknown): DashboardError {
  return error instanceof HttpErrorResponse && error.status === 0
    ? { kind: 'network' }
    : { kind: 'unexpected' };
}

function nearestDeadline(tasks: readonly DashboardTask[]): string {
  const today = new Date();
  const nearest = tasks
    .map((task) => ({ task, date: new Date(task.dueDate) }))
    .filter(({ date }) => !Number.isNaN(date.valueOf()) && date >= today)
    .sort((left, right) => left.date.valueOf() - right.date.valueOf())[0];

  return nearest
    ? nearest.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No upcoming deadline';
}

const distributionLabels = [
  ['to-do', 'To-do'],
  ['in-progress', 'In progress'],
  ['review', 'Review'],
  ['done', 'Done'],
] as const;

export const DashboardStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    visibleTasks: computed(() =>
      store.taskMode() === 'assigned' ? store.assignedTasks() : store.reviewerTasks(),
    ),
    assignedTaskCount: computed(() => store.assignedTasks().length),
    membershipCount: computed(() => {
      const userId = store.context()?.userId;
      return userId === undefined
        ? 0
        : store.boards().filter((board) => board.ownerId !== userId).length;
    }),
    urgentTaskCount: computed(
      () => store.assignedTasks().filter((task) => task.priority === 'high').length,
    ),
    upcomingDeadline: computed(() => nearestDeadline(store.assignedTasks())),
    completionPercentage: computed(() => {
      const tasks = store.assignedTasks();
      return tasks.length === 0
        ? 0
        : Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100);
    }),
    statusDistribution: computed<readonly TaskStatusCount[]>(() =>
      distributionLabels.map(([status, label]) => ({
        label,
        count: store.assignedTasks().filter((task) => task.status === status).length,
      })),
    ),
  })),
  withMethods((store) => {
    const api = inject(DashboardApi);

    const loadDashboard = rxMethod<DashboardContext>(
      pipe(
        tap((context) =>
          patchState(store, {
            context,
            status: 'loading',
            taskInsightsStatus: 'loading',
            error: null,
          }),
        ),
        switchMap(() =>
          forkJoin({
            boards: api.getBoards(),
            tasks: api.getTasks('assigned'),
          }).pipe(
            tap(({ boards, tasks }) =>
              patchState(store, {
                boards: boards.map(toBoard),
                assignedTasks: tasks.map(toTask),
                status: 'success',
                taskInsightsStatus: 'success',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                status: 'error',
                taskInsightsStatus: 'error',
                error: toDashboardError(error),
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const loadReviewerTasks = rxMethod<void>(
      pipe(
        tap(() =>
          patchState(store, {
            taskMode: 'reviewing',
            taskInsightsStatus: 'loading',
            error: null,
          }),
        ),
        switchMap(() =>
          api.getTasks('reviewing').pipe(
            tap((tasks) =>
              patchState(store, {
                reviewerTasks: tasks.map(toTask),
                taskInsightsStatus: 'success',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                taskInsightsStatus: 'error',
                error: toDashboardError(error),
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      loadDashboard,
      selectTaskMode: (mode: DashboardTaskMode): void => {
        if (mode === 'assigned') {
          patchState(store, { taskMode: 'assigned', taskInsightsStatus: 'success', error: null });
          return;
        }
        loadReviewerTasks();
      },
    };
  }),
);
