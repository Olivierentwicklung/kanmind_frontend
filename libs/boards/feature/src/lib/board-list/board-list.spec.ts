import { inputBinding, outputBinding } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { BoardList } from './board-list';

describe('BoardList', () => {
  const boards = [
    {
      id: 7,
      title: 'Migration Board',
      ownerId: 42,
      memberCount: 5,
      ticketCount: 3,
      tasksToDoCount: 1,
      highPriorityTaskCount: 1,
    },
  ];

  it('renders all metrics and emits accessible row actions', async () => {
    const selected = vi.fn();
    const settings = vi.fn();
    await render(BoardList, {
      bindings: [
        inputBinding('boards', () => boards),
        outputBinding('boardSelected', selected),
        outputBinding('settingsRequested', settings),
      ],
    });

    expect(screen.getByText('5 Members')).toBeTruthy();
    expect(screen.getByText('3 Tickets')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open Migration Board' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings for Migration Board' }));
    expect(selected).toHaveBeenCalledWith(7);
    expect(settings).toHaveBeenCalledWith(7);
  });

  it('renders an explicit empty state', async () => {
    await render(BoardList, {
      bindings: [inputBinding('boards', () => [])],
    });

    expect(screen.getByText('No boards available')).toBeTruthy();
  });
});
