import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardApi } from './dashboard-api';
import { DashboardRepository } from './dashboard-repository';

describe('DashboardRepository', () => {
  const api = { getBoards: vi.fn(), getTasks: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        DashboardRepository,
        { provide: DashboardApi, useValue: api },
      ],
    });
  });

  it('maps task transport names and derives assignee initials', async () => {
    api.getTasks.mockReturnValue(
      of([
        {
          id: 21,
          board: 7,
          title: 'Task',
          due_date: '2099-01-01',
          priority: 'high',
          status: 'review',
          comments_count: 2,
          assignee: { id: 1, fullname: 'Ada Lovelace' },
        },
      ]),
    );

    const tasks = await firstValueFrom(
      TestBed.inject(DashboardRepository).getTasks('assigned'),
    );
    expect(tasks[0]).toEqual(
      expect.objectContaining({
        boardId: 7,
        dueDate: '2099-01-01',
        commentsCount: 2,
        assignee: { id: 1, fullName: 'Ada Lovelace', initials: 'AL' },
      }),
    );
  });

  it('maps offline HTTP failures to a dashboard application error', async () => {
    api.getBoards.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );
    await expect(
      firstValueFrom(TestBed.inject(DashboardRepository).getBoards()),
    ).rejects.toEqual({ kind: 'network' });
  });
});
