import { TestBed } from '@angular/core/testing';
import { DashboardRepository } from '@kanmind/dashboard/data-access';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardStore } from './dashboard.store';

describe('DashboardStore', () => {
  const boards = [
    { id: 7, title: 'Owned', ownerId: 42 },
    { id: 8, title: 'Member', ownerId: 99 },
  ];
  const tasks = [
    {
      id: 21,
      boardId: 7,
      title: 'Urgent',
      dueDate: '2099-10-31',
      priority: 'high',
      status: 'to-do',
      commentsCount: 2,
      assignee: { id: 42, fullName: 'Ada Lovelace', initials: 'AL' },
    },
    {
      id: 22,
      boardId: 7,
      title: 'Finished',
      dueDate: '2099-12-31',
      priority: 'low',
      status: 'done',
      commentsCount: 0,
      assignee: null,
    },
  ];
  const api = { getBoards: vi.fn(), getTasks: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardRepository, useValue: api },
      ],
    });
  });

  it('loads dashboard data and derives statistics', () => {
    api.getBoards.mockReturnValue(of(boards));
    api.getTasks.mockReturnValue(of(tasks));
    const store = TestBed.inject(DashboardStore);

    store.loadDashboard({ userId: 42, fullName: 'Ada Lovelace' });

    expect(store.status()).toBe('success');
    expect(store.assignedTaskCount()).toBe(2);
    expect(store.membershipCount()).toBe(1);
    expect(store.urgentTaskCount()).toBe(1);
    expect(store.completionPercentage()).toBe(50);
    expect(store.statusDistribution()).toEqual([
      { label: 'To-do', count: 1 },
      { label: 'In progress', count: 0 },
      { label: 'Review', count: 0 },
      { label: 'Done', count: 1 },
    ]);
  });

  it('exposes loading while the initial reads are pending', () => {
    api.getBoards.mockReturnValue(new Subject());
    api.getTasks.mockReturnValue(new Subject());
    const store = TestBed.inject(DashboardStore);

    store.loadDashboard({ userId: 42, fullName: 'Ada Lovelace' });

    expect(store.status()).toBe('loading');
  });

  it('maps failed initial reads to a dashboard error', () => {
    api.getBoards.mockReturnValue(throwError(() => ({ kind: 'network' })));
    api.getTasks.mockReturnValue(of(tasks));
    const store = TestBed.inject(DashboardStore);

    store.loadDashboard({ userId: 42, fullName: 'Ada Lovelace' });

    expect(store.status()).toBe('error');
    expect(store.error()).toEqual({ kind: 'network' });
  });

  it('replaces task insights with reviewer tasks', () => {
    api.getBoards.mockReturnValue(of(boards));
    api.getTasks
      .mockReturnValueOnce(of(tasks))
      .mockReturnValueOnce(of([tasks[0]]));
    const store = TestBed.inject(DashboardStore);
    store.loadDashboard({ userId: 42, fullName: 'Ada Lovelace' });

    store.selectTaskMode('reviewing');

    expect(api.getTasks).toHaveBeenLastCalledWith('reviewing');
    expect(store.taskMode()).toBe('reviewing');
    expect(store.visibleTasks()).toEqual([expect.objectContaining({ id: 21 })]);
  });
});
