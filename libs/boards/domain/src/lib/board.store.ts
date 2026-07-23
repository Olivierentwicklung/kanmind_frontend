import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  BoardDetailDto,
  BoardMemberDto,
  BoardTaskDto,
  BoardsApi,
  TaskCommentDto,
} from '@kanmind/boards/data-access';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, concatMap, exhaustMap, pipe, switchMap, tap } from 'rxjs';
import {
  BoardDetail,
  BoardMember,
  BoardTask,
  BoardTaskStatus,
  BoardMemberError,
  BoardsError,
  BoardsLoadStatus,
  BoardsMutationStatus,
  SaveBoardTaskCommand,
  TaskComment,
} from './boards.models';

export type BoardDialog = 'closed' | 'create-task' | 'edit-task' | 'task-detail' | 'settings';

interface BoardState {
  board: BoardDetail | null;
  searchQuery: string;
  selectedTaskId: number | null;
  taskFormStatus: BoardTaskStatus;
  comments: readonly TaskComment[];
  dialog: BoardDialog;
  status: BoardsLoadStatus;
  commentStatus: BoardsLoadStatus;
  mutationStatus: BoardsMutationStatus;
  memberStatus: BoardsLoadStatus;
  memberError: BoardMemberError | null;
  error: BoardsError | null;
  deleted: boolean;
}

const initialState: BoardState = {
  board: null,
  searchQuery: '',
  selectedTaskId: null,
  taskFormStatus: 'to-do',
  comments: [],
  dialog: 'closed',
  status: 'idle',
  commentStatus: 'idle',
  mutationStatus: 'idle',
  memberStatus: 'idle',
  memberError: null,
  error: null,
  deleted: false,
};

function toMember(dto: BoardMemberDto): BoardMember {
  return { id: dto.id, email: dto.email, fullName: dto.fullname };
}

function toTask(dto: BoardTaskDto): BoardTask {
  return {
    id: dto.id,
    boardId: dto.board,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    dueDate: dto.due_date,
    commentsCount: dto.comments_count,
    assignee: dto.assignee ? toMember(dto.assignee) : null,
    reviewer: dto.reviewer ? toMember(dto.reviewer) : null,
  };
}

function toBoard(dto: BoardDetailDto): BoardDetail {
  return {
    id: dto.id,
    title: dto.title,
    ownerId: dto.owner_id,
    memberCount: dto.member_count,
    ticketCount: dto.ticket_count,
    tasksToDoCount: dto.tasks_to_do_count,
    highPriorityTaskCount: dto.tasks_high_prio_count,
    members: dto.members.map(toMember),
    tasks: (dto.tasks ?? []).map(toTask),
  };
}

function toComment(dto: TaskCommentDto): TaskComment {
  return {
    id: dto.id,
    author: dto.author,
    content: dto.content,
    createdAt: dto.created_at,
  };
}

function toError(error: unknown): BoardsError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return { kind: 'network' };
    if (error.status === 404) return { kind: 'not-found' };
    if (error.status === 400) return { kind: 'validation' };
  }
  return { kind: 'unexpected' };
}

export const BoardStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    selectedTask: computed(
      () => store.board()?.tasks.find((task) => task.id === store.selectedTaskId()) ?? null,
    ),
    tasksByStatus: computed(() => {
      const query = store.searchQuery().trim().toLocaleLowerCase();
      const tasks = (store.board()?.tasks ?? []).filter(
        (task) =>
          query.length === 0 ||
          task.title.toLocaleLowerCase().includes(query) ||
          task.description.toLocaleLowerCase().includes(query),
      );
      return {
        'to-do': tasks.filter((task) => task.status === 'to-do'),
        'in-progress': tasks.filter((task) => task.status === 'in-progress'),
        review: tasks.filter((task) => task.status === 'review'),
        done: tasks.filter((task) => task.status === 'done'),
      };
    }),
  })),
  withMethods((store, api = inject(BoardsApi)) => {
    const replaceTask = (task: BoardTask): void => {
      const board = store.board();
      if (!board) return;
      patchState(store, {
        board: {
          ...board,
          tasks: board.tasks.map((item) => (item.id === task.id ? task : item)),
        },
      });
    };

    const loadBoard = rxMethod<number>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null, deleted: false })),
        switchMap((boardId) =>
          api.getBoard(boardId).pipe(
            tap((board) => patchState(store, { board: toBoard(board), status: 'success' })),
            catchError((error: unknown) => {
              patchState(store, { status: 'error', error: toError(error) });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const loadComments = rxMethod<number>(
      pipe(
        tap(() => patchState(store, { comments: [], commentStatus: 'loading' })),
        switchMap((taskId) =>
          api.getTaskComments(taskId).pipe(
            tap((comments) =>
              patchState(store, {
                comments: comments.map(toComment),
                commentStatus: 'success',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { commentStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const moveTask = rxMethod<{ taskId: number; status: BoardTaskStatus }>(
      pipe(
        concatMap(({ taskId, status }) => {
          patchState(store, { mutationStatus: 'loading', error: null });
          return api.updateTask(taskId, { status }).pipe(
            tap((task) => {
              replaceTask(toTask(task));
              patchState(store, { mutationStatus: 'idle' });
            }),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const saveTask = rxMethod<SaveBoardTaskCommand>(
      pipe(
        exhaustMap((command) => {
          const board = store.board();
          if (!board) return EMPTY;
          patchState(store, { mutationStatus: 'loading', error: null });
          const request = {
            board: board.id,
            title: command.title,
            description: command.description,
            status: command.status,
            priority: command.priority,
            assignee_id: command.assigneeId,
            reviewer_id: command.reviewerId,
            due_date: command.dueDate,
          };
          const selectedTaskId = store.selectedTaskId();
          const request$ =
            store.dialog() === 'edit-task' && selectedTaskId !== null
              ? api.updateTask(selectedTaskId, request)
              : api.createTask(request);
          return request$.pipe(
            tap((dto) => {
              const task = toTask(dto);
              const currentBoard = store.board();
              if (!currentBoard) return;
              const exists = currentBoard.tasks.some((item) => item.id === task.id);
              patchState(store, {
                board: {
                  ...currentBoard,
                  tasks: exists
                    ? currentBoard.tasks.map((item) => (item.id === task.id ? task : item))
                    : [...currentBoard.tasks, task],
                },
                selectedTaskId: null,
                dialog: 'closed',
                mutationStatus: 'idle',
              });
            }),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const deleteTask = rxMethod<void>(
      pipe(
        exhaustMap(() => {
          const board = store.board();
          const taskId = store.selectedTaskId();
          if (!board || taskId === null) return EMPTY;
          patchState(store, { mutationStatus: 'loading', error: null });
          return api.deleteTask(taskId).pipe(
            tap(() =>
              patchState(store, {
                board: { ...board, tasks: board.tasks.filter((task) => task.id !== taskId) },
                selectedTaskId: null,
                dialog: 'closed',
                mutationStatus: 'idle',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const addComment = rxMethod<string>(
      pipe(
        concatMap((rawContent) => {
          const content = rawContent.trim();
          const taskId = store.selectedTaskId();
          if (!content || taskId === null) return EMPTY;
          patchState(store, { mutationStatus: 'loading', error: null });
          return api.createTaskComment(taskId, content).pipe(
            tap((comment) =>
              patchState(store, {
                comments: [...store.comments(), toComment(comment)],
                mutationStatus: 'idle',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const deleteComment = rxMethod<number>(
      pipe(
        concatMap((commentId) => {
          const taskId = store.selectedTaskId();
          if (taskId === null) return EMPTY;
          return api.deleteTaskComment(taskId, commentId).pipe(
            tap(() =>
              patchState(store, {
                comments: store.comments().filter((comment) => comment.id !== commentId),
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const renameBoard = rxMethod<string>(
      pipe(
        exhaustMap((title) => {
          const board = store.board();
          if (!board) return EMPTY;
          return api.updateBoard(board.id, { title }).pipe(
            tap(() => patchState(store, { board: { ...board, title } })),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const deleteBoard = rxMethod<void>(
      pipe(
        exhaustMap(() => {
          const board = store.board();
          if (!board) return EMPTY;
          return api.deleteBoard(board.id).pipe(
            tap(() =>
              patchState(store, {
                board: null,
                dialog: 'closed',
                deleted: true,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { mutationStatus: 'error', error: toError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const inviteBoardMember = rxMethod<string>(
      pipe(
        concatMap((email) => {
          const board = store.board();
          if (!board) return EMPTY;
          if (board.members.some((member) => member.email === email)) {
            patchState(store, { memberStatus: 'error', memberError: 'duplicate' });
            return EMPTY;
          }
          patchState(store, { memberStatus: 'loading', memberError: null });
          return api.findMember(email).pipe(
            concatMap((memberDto) => {
              const member = toMember(memberDto);
              const members = [...board.members, member];
              return api
                .updateBoard(board.id, { members: members.map((item) => item.id) })
                .pipe(
                  tap(() =>
                    patchState(store, {
                      board: { ...board, members },
                      memberStatus: 'success',
                    }),
                  ),
                );
            }),
            catchError((error: unknown) => {
              const memberError: BoardMemberError =
                error instanceof HttpErrorResponse && error.status === 404
                  ? 'not-found'
                  : error instanceof HttpErrorResponse && error.status === 0
                    ? 'network'
                    : 'unexpected';
              patchState(store, { memberStatus: 'error', memberError });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const removeBoardMember = rxMethod<number>(
      pipe(
        concatMap((memberId) => {
          const board = store.board();
          if (!board || memberId === board.ownerId) return EMPTY;
          const members = board.members.filter((member) => member.id !== memberId);
          patchState(store, { mutationStatus: 'loading', error: null });
          return api
            .updateBoard(board.id, { members: members.map((member) => member.id) })
            .pipe(
              tap(() =>
                patchState(store, {
                  board: { ...board, members },
                  mutationStatus: 'idle',
                }),
              ),
              catchError((error: unknown) => {
                patchState(store, { mutationStatus: 'error', error: toError(error) });
                return EMPTY;
              }),
            );
        }),
      ),
    );

    return {
      loadBoard,
      moveTask,
      saveTask,
      deleteTask,
      addComment,
      deleteComment,
      renameBoard,
      deleteBoard,
      inviteBoardMember,
      removeBoardMember,
      applySearch: (searchQuery: string): void => patchState(store, { searchQuery }),
      openCreateTask: (status: BoardTaskStatus): void =>
        patchState(store, {
          selectedTaskId: null,
          taskFormStatus: status,
          dialog: 'create-task',
          mutationStatus: 'idle',
          error: null,
        }),
      openTask: (taskId: number): void => {
        patchState(store, { selectedTaskId: taskId, dialog: 'task-detail' });
        loadComments(taskId);
      },
      editTask: (): void => patchState(store, { dialog: 'edit-task' }),
      openSettings: (): void => patchState(store, { dialog: 'settings' }),
      closeDialog: (): void =>
        patchState(store, {
          dialog: 'closed',
          selectedTaskId: null,
          comments: [],
          mutationStatus: 'idle',
          error: null,
        }),
    };
  }),
);
