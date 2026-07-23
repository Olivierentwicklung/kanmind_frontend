import { inputBinding, outputBinding } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { DashboardOverview } from './dashboard-overview';

describe('DashboardOverview', () => {
  const view = {
    fullName: 'Ada Lovelace',
    assignedTaskCount: 3,
    membershipCount: 1,
    urgentTaskCount: 1,
    upcomingDeadline: 'October 31, 2099',
    completionPercentage: 33,
    distribution: [
      { label: 'To-do', count: 1 },
      { label: 'In progress', count: 1 },
      { label: 'Review', count: 0 },
      { label: 'Done', count: 1 },
    ],
    boards: [{ id: 7, title: 'Migration Board', ownerId: 42 }],
  };

  it('renders dashboard statistics and board navigation intent', async () => {
    const boardSelected = vi.fn();
    await render(DashboardOverview, {
      bindings: [
        inputBinding('view', () => view),
        outputBinding('boardSelected', boardSelected),
      ],
    });

    expect(screen.getByRole('heading', { level: 1, name: /Welcome Ada Lovelace/ })).toBeTruthy();
    expect(screen.getByText('October 31, 2099')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open Migration Board' }));
    expect(boardSelected).toHaveBeenCalledWith(7);
  });

  it('renders an explicit empty board state', async () => {
    await render(DashboardOverview, {
      bindings: [inputBinding('view', () => ({ ...view, boards: [] }))],
    });

    expect(screen.getByText('No boards available')).toBeTruthy();
  });
});
