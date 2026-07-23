import { TestBed } from '@angular/core/testing';
import { BoardsRepository } from '@kanmind/boards/data-access';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  const members = [
    { id: 42, email: 'ada@example.com', fullName: 'Ada Lovelace' },
    { id: 43, email: 'grace@example.com', fullName: 'Grace Hopper' },
  ];
  const tasks = [
    {
      id: 21,
      boardId: 7,
      title: 'Build migration safety net',
      description: 'Characterize the frontend',
      status: 'to-do' as const,
      priority: 'high' as const,
      dueDate: '2099-12-31',
      commentsCount: 1,
      assignee: members[0],
      reviewer: members[1],
    },
    {
      id: 22,
      boardId: 7,
      title: 'Ship Angular',
      description: 'Preserve behavior',
      status: 'done' as const,
      priority: 'low' as const,
      dueDate: '2099-10-31',
      commentsCount: 0,
      assignee: null,
      reviewer: null,
    },
  ];
  const detail = {
    id: 7,
    title: 'Migration Board',
    ownerId: 42,
    memberCount: 2,
    ticketCount: 2,
    tasksToDoCount: 1,
    highPriorityTaskCount: 1,
    members,
    tasks,
  };
  const api = {
    getBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTaskComments: vi.fn(),
    createTaskComment: vi.fn(),
    deleteTaskComment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [BoardStore, { provide: BoardsRepository, useValue: api }],
    });
  });

  it('loads a board and groups filtered tasks by status', () => {
    api.getBoard.mockReturnValue(of(detail));
    const store = TestBed.inject(BoardStore);

    store.loadBoard(7);
    store.applySearch('PRESERVE');

    expect(store.status()).toBe('success');
    expect(store.board()?.title).toBe('Migration Board');
    expect(store.tasksByStatus().done.map((task) => task.id)).toEqual([22]);
    expect(store.tasksByStatus()['to-do']).toEqual([]);
  });

  it('moves a task and persists only the status', () => {
    api.getBoard.mockReturnValue(of(detail));
    api.updateTask.mockReturnValue(of({ ...tasks[0], status: 'review' }));
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);

    store.moveTask({ taskId: 21, status: 'review' });

    expect(api.updateTask).toHaveBeenCalledWith(21, { status: 'review' });
    expect(store.tasksByStatus().review[0].id).toBe(21);
  });

  it('creates a task using the board contract', () => {
    api.getBoard.mockReturnValue(of(detail));
    api.createTask.mockReturnValue(
      of({ ...tasks[0], id: 24, title: 'New task' }),
    );
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);
    store.openCreateTask('review');

    store.saveTask({
      title: 'New task',
      description: 'Description',
      status: 'review',
      priority: 'medium',
      assigneeId: null,
      reviewerId: 43,
      dueDate: '2099-09-30',
    });

    expect(api.createTask).toHaveBeenCalledWith({
      boardId: 7,
      title: 'New task',
      description: 'Description',
      status: 'review',
      priority: 'medium',
      assigneeId: null,
      reviewerId: 43,
      dueDate: '2099-09-30',
    });
    expect(store.dialog()).toBe('closed');
  });

  it('loads task comments and ignores blank comments', () => {
    api.getBoard.mockReturnValue(of(detail));
    api.getTaskComments.mockReturnValue(
      of([
        {
          id: 31,
          author: 'Ada Lovelace',
          content: 'Existing',
          createdAt: '2025-01-01',
        },
      ]),
    );
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);
    store.openTask(21);
    store.addComment('   ');

    expect(store.comments()[0].content).toBe('Existing');
    expect(api.createTaskComment).not.toHaveBeenCalled();
  });

  it('exposes a board load failure', () => {
    api.getBoard.mockReturnValue(throwError(() => ({ kind: 'not-found' })));
    const store = TestBed.inject(BoardStore);

    store.loadBoard(999);

    expect(store.status()).toBe('error');
    expect(store.error()).toEqual({ kind: 'not-found' });
  });

  it('tracks a pending comment deletion and returns to idle after success', () => {
    const deletion = new Subject<void>();
    api.getBoard.mockReturnValue(of(detail));
    api.getTaskComments.mockReturnValue(
      of([
        {
          id: 31,
          author: 'Ada',
          content: 'Remove me',
          createdAt: '2025-01-01',
        },
      ]),
    );
    api.deleteTaskComment.mockReturnValue(deletion);
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);
    store.openTask(21);

    store.deleteComment(31);
    expect(store.mutationStatus()).toBe('loading');

    deletion.next();
    deletion.complete();
    expect(store.comments()).toEqual([]);
    expect(store.mutationStatus()).toBe('idle');
  });

  it('exposes a failed rename and clears stale errors when retrying', () => {
    api.getBoard.mockReturnValue(of(detail));
    api.updateBoard.mockReturnValue(throwError(() => ({ kind: 'validation' })));
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);

    store.renameBoard('Invalid');
    expect(store.mutationStatus()).toBe('error');
    expect(store.error()).toEqual({ kind: 'validation' });

    api.updateBoard.mockReturnValue(of({ ...detail, title: 'Valid' }));
    store.renameBoard('Valid');
    expect(store.mutationStatus()).toBe('idle');
    expect(store.error()).toBeNull();
    expect(store.board()?.title).toBe('Valid');
  });

  it('tracks board deletion through loading and success', () => {
    const deletion = new Subject<void>();
    api.getBoard.mockReturnValue(of(detail));
    api.deleteBoard.mockReturnValue(deletion);
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);

    store.deleteBoard();
    expect(store.mutationStatus()).toBe('loading');

    deletion.next();
    deletion.complete();
    expect(store.mutationStatus()).toBe('idle');
    expect(store.deleted()).toBe(true);
    expect(store.board()).toBeNull();
  });
});
