import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BoardsApi } from '@kanmind/boards/data-access';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  const members = [
    { id: 42, email: 'ada@example.com', fullname: 'Ada Lovelace' },
    { id: 43, email: 'grace@example.com', fullname: 'Grace Hopper' },
  ];
  const tasks = [
    {
      id: 21,
      board: 7,
      title: 'Build migration safety net',
      description: 'Characterize the frontend',
      status: 'to-do' as const,
      priority: 'high' as const,
      due_date: '2099-12-31',
      comments_count: 1,
      assignee: members[0],
      reviewer: members[1],
    },
    {
      id: 22,
      board: 7,
      title: 'Ship Angular',
      description: 'Preserve behavior',
      status: 'done' as const,
      priority: 'low' as const,
      due_date: '2099-10-31',
      comments_count: 0,
      assignee: null,
      reviewer: null,
    },
  ];
  const detail = {
    id: 7,
    title: 'Migration Board',
    owner_id: 42,
    member_count: 2,
    ticket_count: 2,
    tasks_to_do_count: 1,
    tasks_high_prio_count: 1,
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
      providers: [BoardStore, { provide: BoardsApi, useValue: api }],
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
    api.createTask.mockReturnValue(of({ ...tasks[0], id: 24, title: 'New task' }));
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
      board: 7,
      title: 'New task',
      description: 'Description',
      status: 'review',
      priority: 'medium',
      assignee_id: null,
      reviewer_id: 43,
      due_date: '2099-09-30',
    });
    expect(store.dialog()).toBe('closed');
  });

  it('loads task comments and ignores blank comments', () => {
    api.getBoard.mockReturnValue(of(detail));
    api.getTaskComments.mockReturnValue(
      of([{ id: 31, author: 'Ada Lovelace', content: 'Existing', created_at: '2025-01-01' }]),
    );
    const store = TestBed.inject(BoardStore);
    store.loadBoard(7);
    store.openTask(21);
    store.addComment('   ');

    expect(store.comments()[0].content).toBe('Existing');
    expect(api.createTaskComment).not.toHaveBeenCalled();
  });

  it('exposes a board load failure', () => {
    api.getBoard.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    const store = TestBed.inject(BoardStore);

    store.loadBoard(999);

    expect(store.status()).toBe('error');
    expect(store.error()).toEqual({ kind: 'not-found' });
  });
});
