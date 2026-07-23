import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BoardsApi } from '@kanmind/boards/data-access';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BoardsStore } from './boards.store';

describe('BoardsStore', () => {
  const summaries = [
    {
      id: 7,
      title: 'Migration Board',
      owner_id: 42,
      member_count: 5,
      ticket_count: 3,
      tasks_to_do_count: 1,
      tasks_high_prio_count: 1,
    },
    {
      id: 8,
      title: 'Product Roadmap',
      owner_id: 99,
      member_count: 2,
      ticket_count: 4,
      tasks_to_do_count: 2,
      tasks_high_prio_count: 0,
    },
  ];
  const detail = {
    ...summaries[0],
    members: [
      { id: 42, email: 'ada@example.com', fullname: 'Ada Lovelace' },
      { id: 43, email: 'grace@example.com', fullname: 'Grace Hopper' },
    ],
  };
  const api = {
    getBoards: vi.fn(),
    getBoard: vi.fn(),
    findMember: vi.fn(),
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [BoardsStore, { provide: BoardsApi, useValue: api }],
    });
  });

  it('loads summaries and filters them case-insensitively', () => {
    api.getBoards.mockReturnValue(of(summaries));
    const store = TestBed.inject(BoardsStore);

    store.loadBoards();
    store.applySearch('roadMAP');

    expect(store.status()).toBe('success');
    expect(store.visibleBoards()).toEqual([expect.objectContaining({ id: 8 })]);
  });

  it('exposes loading and maps a failed list request', () => {
    api.getBoards.mockReturnValue(new Subject());
    const loadingStore = TestBed.inject(BoardsStore);
    loadingStore.loadBoards();
    expect(loadingStore.status()).toBe('loading');

    TestBed.resetTestingModule();
    api.getBoards.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    TestBed.configureTestingModule({
      providers: [BoardsStore, { provide: BoardsApi, useValue: api }],
    });
    const failedStore = TestBed.inject(BoardsStore);
    failedStore.loadBoards();
    expect(failedStore.status()).toBe('error');
    expect(failedStore.error()).toEqual({ kind: 'network' });
  });

  it('opens create mode, resolves unique members and creates a board', () => {
    api.findMember.mockReturnValue(
      of({ id: 43, email: 'grace@example.com', fullname: 'Grace Hopper' }),
    );
    api.createBoard.mockReturnValue(of({ ...summaries[0], id: 9, title: 'Angular Migration' }));
    const store = TestBed.inject(BoardsStore);

    store.openCreateBoard();
    store.inviteCreateMember('grace@example.com');
    store.inviteCreateMember('grace@example.com');
    expect(store.createMembers()).toHaveLength(1);
    expect(store.memberError()).toBe('duplicate');

    store.createBoard('Angular Migration');

    expect(api.createBoard).toHaveBeenCalledWith({
      title: 'Angular Migration',
      members: [43],
    });
    expect(store.boards()).toContainEqual(expect.objectContaining({ id: 9 }));
    expect(store.dialog()).toBe('closed');
  });

  it('loads settings, preserves the owner and updates members and title', () => {
    api.getBoard.mockReturnValue(of(detail));
    api.updateBoard.mockImplementation((_id: number, command: object) =>
      of({ ...detail, ...command }),
    );
    const store = TestBed.inject(BoardsStore);

    store.openBoardSettings(7);
    store.removeBoardMember(42);
    expect(api.updateBoard).not.toHaveBeenCalled();

    store.removeBoardMember(43);
    expect(api.updateBoard).toHaveBeenCalledWith(7, { members: [42] });

    store.renameBoard('Renamed Board');
    expect(api.updateBoard).toHaveBeenLastCalledWith(7, { title: 'Renamed Board' });
    expect(store.selectedBoard()?.title).toBe('Renamed Board');
  });

  it('deletes the selected board and closes settings', () => {
    api.getBoards.mockReturnValue(of(summaries));
    api.getBoard.mockReturnValue(of(detail));
    api.deleteBoard.mockReturnValue(of(undefined));
    const store = TestBed.inject(BoardsStore);
    store.loadBoards();
    store.openBoardSettings(7);

    store.deleteSelectedBoard();

    expect(store.boards().map((board) => board.id)).toEqual([8]);
    expect(store.dialog()).toBe('closed');
  });

  it('keeps create mode open and exposes a failed board write', () => {
    api.createBoard.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );
    const store = TestBed.inject(BoardsStore);
    store.openCreateBoard();

    store.createBoard('Angular Migration');

    expect(store.dialog()).toBe('create');
    expect(store.mutationStatus()).toBe('error');
    expect(store.error()).toEqual({ kind: 'validation' });
  });
});
