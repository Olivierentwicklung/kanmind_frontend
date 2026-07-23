import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  BoardDetailDto,
  BoardMemberDto,
  BoardSummaryDto,
  BoardsApi,
} from '@kanmind/boards/data-access';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  EMPTY,
  catchError,
  concatMap,
  exhaustMap,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import {
  BoardDetail,
  BoardMember,
  BoardMemberError,
  BoardsDialog,
  BoardsError,
  BoardsLoadStatus,
  BoardsMutationStatus,
  BoardSummary,
} from './boards.models';

interface BoardsState {
  boards: readonly BoardSummary[];
  searchQuery: string;
  dialog: BoardsDialog;
  createMembers: readonly BoardMember[];
  selectedBoard: BoardDetail | null;
  status: BoardsLoadStatus;
  detailStatus: BoardsLoadStatus;
  memberStatus: BoardsLoadStatus;
  mutationStatus: BoardsMutationStatus;
  error: BoardsError | null;
  memberError: BoardMemberError | null;
}

const initialState: BoardsState = {
  boards: [],
  searchQuery: '',
  dialog: 'closed',
  createMembers: [],
  selectedBoard: null,
  status: 'idle',
  detailStatus: 'idle',
  memberStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
  memberError: null,
};

function toBoardSummary(dto: BoardSummaryDto): BoardSummary {
  return {
    id: dto.id,
    title: dto.title,
    ownerId: dto.owner_id,
    memberCount: dto.member_count,
    ticketCount: dto.ticket_count,
    tasksToDoCount: dto.tasks_to_do_count,
    highPriorityTaskCount: dto.tasks_high_prio_count,
  };
}

function toBoardMember(dto: BoardMemberDto): BoardMember {
  return { id: dto.id, email: dto.email, fullName: dto.fullname };
}

function toBoardDetail(dto: BoardDetailDto): BoardDetail {
  return {
    ...toBoardSummary(dto),
    members: dto.members.map(toBoardMember),
  };
}

function toBoardsError(error: unknown): BoardsError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return { kind: 'network' };
    if (error.status === 404) return { kind: 'not-found' };
    if (error.status === 400) return { kind: 'validation' };
  }
  return { kind: 'unexpected' };
}

function toMemberError(error: unknown): BoardMemberError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'network';
    if (error.status === 404) return 'not-found';
  }
  return 'unexpected';
}

export const BoardsStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    visibleBoards: computed(() => {
      const query = store.searchQuery().trim().toLocaleLowerCase();
      return query.length === 0
        ? store.boards()
        : store.boards().filter((board) =>
            board.title.toLocaleLowerCase().includes(query),
          );
    }),
  })),
  withMethods((store, api = inject(BoardsApi)) => {
    const loadBoards = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading', error: null })),
        switchMap(() =>
          api.getBoards().pipe(
            tap((boards) =>
              patchState(store, {
                boards: boards.map(toBoardSummary),
                status: 'success',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, { status: 'error', error: toBoardsError(error) });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const openBoardSettings = rxMethod<number>(
      pipe(
        tap(() =>
          patchState(store, {
            dialog: 'settings',
            selectedBoard: null,
            detailStatus: 'loading',
            mutationStatus: 'idle',
            memberStatus: 'idle',
            memberError: null,
            error: null,
          }),
        ),
        switchMap((boardId) =>
          api.getBoard(boardId).pipe(
            tap((board) =>
              patchState(store, {
                selectedBoard: toBoardDetail(board),
                detailStatus: 'success',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                detailStatus: 'error',
                error: toBoardsError(error),
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const inviteCreateMember = rxMethod<string>(
      pipe(
        tap(() =>
          patchState(store, {
            memberStatus: 'loading',
            memberError: null,
          }),
        ),
        switchMap((email) => {
          if (store.createMembers().some((member) => member.email === email)) {
            patchState(store, { memberStatus: 'error', memberError: 'duplicate' });
            return EMPTY;
          }
          return api.findMember(email).pipe(
            tap((member) =>
              patchState(store, {
                createMembers: [...store.createMembers(), toBoardMember(member)],
                memberStatus: 'success',
                memberError: null,
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                memberStatus: 'error',
                memberError: toMemberError(error),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const createBoard = rxMethod<string>(
      pipe(
        tap(() =>
          patchState(store, { mutationStatus: 'loading', error: null }),
        ),
        exhaustMap((title) =>
          api
            .createBoard({
              title,
              members: store.createMembers().map((member) => member.id),
            })
            .pipe(
              tap((created) =>
                patchState(store, {
                  boards: [...store.boards(), toBoardSummary(created)],
                  dialog: 'closed',
                  createMembers: [],
                  mutationStatus: 'idle',
                }),
              ),
              catchError((error: unknown) => {
                patchState(store, {
                  mutationStatus: 'error',
                  error: toBoardsError(error),
                });
                return EMPTY;
              }),
            ),
        ),
      ),
    );

    const inviteBoardMember = rxMethod<string>(
      pipe(
        tap(() =>
          patchState(store, { memberStatus: 'loading', memberError: null }),
        ),
        concatMap((email) => {
          const board = store.selectedBoard();
          if (!board) return EMPTY;
          if (board.members.some((member) => member.email === email)) {
            patchState(store, { memberStatus: 'error', memberError: 'duplicate' });
            return EMPTY;
          }
          return api.findMember(email).pipe(
            concatMap((member) => {
              const members = [...board.members, toBoardMember(member)];
              return api
                .updateBoard(board.id, {
                  members: members.map((item) => item.id),
                })
                .pipe(
                  tap(() =>
                    patchState(store, {
                      selectedBoard: { ...board, members },
                      memberStatus: 'success',
                      memberError: null,
                    }),
                  ),
                );
            }),
            catchError((error: unknown) => {
              patchState(store, {
                memberStatus: 'error',
                memberError: toMemberError(error),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const removeBoardMember = rxMethod<number>(
      pipe(
        concatMap((memberId) => {
          const board = store.selectedBoard();
          if (!board || memberId === board.ownerId) return EMPTY;
          const members = board.members.filter((member) => member.id !== memberId);
          patchState(store, { mutationStatus: 'loading', error: null });
          return api
            .updateBoard(board.id, { members: members.map((member) => member.id) })
            .pipe(
              tap(() =>
                patchState(store, {
                  selectedBoard: { ...board, members },
                  mutationStatus: 'idle',
                }),
              ),
              catchError((error: unknown) => {
                patchState(store, {
                  mutationStatus: 'error',
                  error: toBoardsError(error),
                });
                return EMPTY;
              }),
            );
        }),
      ),
    );

    const renameBoard = rxMethod<string>(
      pipe(
        exhaustMap((title) => {
          const board = store.selectedBoard();
          if (!board) return EMPTY;
          patchState(store, { mutationStatus: 'loading', error: null });
          return api.updateBoard(board.id, { title }).pipe(
            tap(() =>
              patchState(store, {
                selectedBoard: { ...board, title },
                boards: store
                  .boards()
                  .map((item) => (item.id === board.id ? { ...item, title } : item)),
                mutationStatus: 'idle',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                mutationStatus: 'error',
                error: toBoardsError(error),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const deleteSelectedBoard = rxMethod<void>(
      pipe(
        exhaustMap(() => {
          const board = store.selectedBoard();
          if (!board) return EMPTY;
          patchState(store, { mutationStatus: 'loading', error: null });
          return api.deleteBoard(board.id).pipe(
            tap(() =>
              patchState(store, {
                boards: store.boards().filter((item) => item.id !== board.id),
                selectedBoard: null,
                dialog: 'closed',
                mutationStatus: 'idle',
              }),
            ),
            catchError((error: unknown) => {
              patchState(store, {
                mutationStatus: 'error',
                error: toBoardsError(error),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    return {
      loadBoards,
      openBoardSettings,
      inviteCreateMember,
      createBoard,
      inviteBoardMember,
      removeBoardMember,
      renameBoard,
      deleteSelectedBoard,
      applySearch: (searchQuery: string): void => patchState(store, { searchQuery }),
      openCreateBoard: (): void =>
        patchState(store, {
          dialog: 'create',
          createMembers: [],
          memberStatus: 'idle',
          mutationStatus: 'idle',
          memberError: null,
          error: null,
        }),
      removeCreateMember: (memberId: number): void =>
        patchState(store, {
          createMembers: store.createMembers().filter((member) => member.id !== memberId),
        }),
      closeDialog: (): void =>
        patchState(store, {
          dialog: 'closed',
          selectedBoard: null,
          createMembers: [],
          detailStatus: 'idle',
          memberStatus: 'idle',
          mutationStatus: 'idle',
          memberError: null,
          error: null,
        }),
    };
  }),
);
