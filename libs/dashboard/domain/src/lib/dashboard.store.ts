import { computed, inject } from '@angular/core';
import {
  DashboardRepository,
  toDashboardRepositoryError,
} from '@kanmind/dashboard/data-access';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
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

function toDashboardError(error: unknown): DashboardError {
  return toDashboardRepositoryError(error);
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
      store.taskMode() === 'assigned'
        ? store.assignedTasks()
        : store.reviewerTasks(),
    ),
    assignedTaskCount: computed(() => store.assignedTasks().length),
    membershipCount: computed(() => {
      const userId = store.context()?.userId;
      return userId === undefined
        ? 0
        : store.boards().filter((board) => board.ownerId !== userId).length;
    }),
    urgentTaskCount: computed(
      () =>
        store.assignedTasks().filter((task) => task.priority === 'high').length,
    ),
    upcomingDeadline: computed(() => nearestDeadline(store.assignedTasks())),
    completionPercentage: computed(() => {
      const tasks = store.assignedTasks();
      return tasks.length === 0
        ? 0
        : Math.round(
            (tasks.filter((task) => task.status === 'done').length /
              tasks.length) *
              100,
          );
    }),
    statusDistribution: computed<readonly TaskStatusCount[]>(() =>
      distributionLabels.map(([status, label]) => ({
        label,
        count: store.assignedTasks().filter((task) => task.status === status)
          .length,
      })),
    ),
  })),
  withMethods((store) => {
    const repository = inject(DashboardRepository);

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
            boards: repository.getBoards(),
            tasks: repository.getTasks('assigned'),
          }).pipe(
            tap(({ boards, tasks }) =>
              patchState(store, {
                boards,
                assignedTasks: tasks,
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
          repository.getTasks('reviewing').pipe(
            tap((tasks) =>
              patchState(store, {
                reviewerTasks: tasks,
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
          patchState(store, {
            taskMode: 'assigned',
            taskInsightsStatus: 'success',
            error: null,
          });
          return;
        }
        loadReviewerTasks();
      },
    };
  }),
);
