import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BoardsApi } from './boards-api';
import { BoardsRepository } from './boards-repository';

describe('BoardsRepository', () => {
  const api = {
    getBoard: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [BoardsRepository, { provide: BoardsApi, useValue: api }],
    });
  });

  it('maps one board graph with shared member and task adapters', async () => {
    const member = {
      id: 1,
      email: 'ada@example.com',
      fullname: 'Ada Lovelace',
    };
    api.getBoard.mockReturnValue(
      of({
        id: 7,
        title: 'Board',
        owner_id: 1,
        member_count: 1,
        ticket_count: 1,
        tasks_to_do_count: 1,
        tasks_high_prio_count: 1,
        members: [member],
        tasks: [
          {
            id: 21,
            board: 7,
            title: 'Task',
            description: '',
            status: 'to-do',
            priority: 'high',
            due_date: '2099-01-01',
            comments_count: 0,
            assignee: member,
            reviewer: null,
          },
        ],
      }),
    );

    const board = await firstValueFrom(
      TestBed.inject(BoardsRepository).getBoard(7),
    );
    expect(board.ownerId).toBe(1);
    expect(board.members[0].fullName).toBe('Ada Lovelace');
    expect(board.tasks[0]).toEqual(
      expect.objectContaining({
        boardId: 7,
        dueDate: '2099-01-01',
        commentsCount: 0,
      }),
    );
  });

  it('maps HTTP failures to a boards application error', async () => {
    api.getBoard.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    await expect(
      firstValueFrom(TestBed.inject(BoardsRepository).getBoard(99)),
    ).rejects.toEqual({ kind: 'not-found' });
  });

  it('maps application task commands to API request DTOs', async () => {
    const taskDto = {
      id: 21,
      board: 7,
      title: 'Task',
      description: 'Description',
      status: 'review',
      priority: 'high',
      due_date: '2099-01-01',
      comments_count: 0,
      assignee: null,
      reviewer: null,
    };
    api.createTask.mockReturnValue(of(taskDto));
    api.updateTask.mockReturnValue(of(taskDto));
    const repository = TestBed.inject(BoardsRepository);

    await firstValueFrom(
      repository.createTask({
        boardId: 7,
        title: 'Task',
        description: 'Description',
        status: 'review',
        priority: 'high',
        assigneeId: 1,
        reviewerId: null,
        dueDate: '2099-01-01',
      }),
    );
    await firstValueFrom(repository.updateTask(21, { status: 'done' }));

    expect(api.createTask).toHaveBeenCalledWith({
      board: 7,
      title: 'Task',
      description: 'Description',
      status: 'review',
      priority: 'high',
      assignee_id: 1,
      reviewer_id: null,
      due_date: '2099-01-01',
    });
    expect(api.updateTask).toHaveBeenCalledWith(21, { status: 'done' });
  });
});
