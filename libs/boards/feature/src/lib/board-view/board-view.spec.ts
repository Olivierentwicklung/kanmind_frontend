import { inputBinding, outputBinding } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { BoardView } from './board-view';

describe('BoardView', () => {
  const board = {
    id: 7,
    title: 'Migration Board',
    ownerId: 42,
    memberCount: 2,
    ticketCount: 1,
    tasksToDoCount: 1,
    highPriorityTaskCount: 1,
    members: [
      { id: 42, email: 'ada@example.com', fullName: 'Ada Lovelace' },
      { id: 43, email: 'grace@example.com', fullName: 'Grace Hopper' },
    ],
    tasks: [
      {
        id: 21,
        boardId: 7,
        title: 'Build migration safety net',
        description: 'Protect behavior',
        status: 'to-do' as const,
        priority: 'high' as const,
        dueDate: '2099-12-31',
        commentsCount: 1,
        assignee: null,
        reviewer: null,
      },
    ],
  };
  const tasksByStatus = {
    'to-do': board.tasks,
    'in-progress': [],
    review: [],
    done: [],
  };

  it('renders board columns and emits task intents', async () => {
    const createTask = vi.fn();
    const selected = vi.fn();
    await render(BoardView, {
      bindings: [
        inputBinding('board', () => board),
        inputBinding('tasksByStatus', () => tasksByStatus),
        outputBinding('createTaskRequested', createTask),
        outputBinding('taskSelected', selected),
      ],
    });

    expect(
      screen.getByRole('heading', { name: 'Migration Board' }),
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'To-do' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Done' })).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Add task to In-progress' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Open Build migration safety net' }),
    );
    expect(createTask).toHaveBeenCalledWith('in-progress');
    expect(selected).toHaveBeenCalledWith(21);
  });

  it('emits search text', async () => {
    const searched = vi.fn();
    await render(BoardView, {
      bindings: [
        inputBinding('board', () => board),
        inputBinding('tasksByStatus', () => tasksByStatus),
        outputBinding('searchChanged', searched),
      ],
    });

    fireEvent.input(screen.getByLabelText('Search tasks'), {
      target: { value: 'migration' },
    });
    expect(searched).toHaveBeenCalledWith('migration');
  });

  it('provides accessible member overflow and task move controls', async () => {
    const moved = vi.fn();
    const boardWithOverflow = {
      ...board,
      members: [
        ...board.members,
        { id: 44, email: 'linus@example.com', fullName: 'Linus Torvalds' },
        {
          id: 45,
          email: 'margaret@example.com',
          fullName: 'Margaret Hamilton',
        },
        { id: 46, email: 'alan@example.com', fullName: 'Alan Turing' },
      ],
    };
    await render(BoardView, {
      bindings: [
        inputBinding('board', () => boardWithOverflow),
        inputBinding('tasksByStatus', () => tasksByStatus),
        outputBinding('taskMoved', moved),
      ],
    });

    expect(screen.getByLabelText('1 more board member')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Move Build migration safety net to In-progress',
      }),
    );
    expect(moved).toHaveBeenCalledWith({ taskId: 21, status: 'in-progress' });
  });
});
