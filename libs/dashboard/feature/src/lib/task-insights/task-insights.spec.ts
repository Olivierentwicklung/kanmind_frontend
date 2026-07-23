import { inputBinding, outputBinding, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { TaskInsights } from './task-insights';

describe('TaskInsights', () => {
  const task = {
    id: 21,
    boardId: 7,
    title: 'Build migration safety net',
    dueDate: '2099-12-31',
    priority: 'high' as const,
    status: 'to-do' as const,
    commentsCount: 2,
    assignee: { id: 42, fullName: 'Ada Lovelace', initials: 'AL' },
  };

  it('renders task metadata and emits selection', async () => {
    const taskSelected = vi.fn();
    await render(TaskInsights, {
      bindings: [
        inputBinding('tasks', () => [task]),
        outputBinding('taskSelected', taskSelected),
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /Open task Build migration safety net/ }));
    expect(screen.getByText('2099-12-31')).toBeTruthy();
    expect(taskSelected).toHaveBeenCalledWith({ boardId: 7, taskId: 21 });
  });

  it('offers an accessible task mode switch', async () => {
    const modeChanged = vi.fn();
    await render(TaskInsights, {
      bindings: [outputBinding('modeChanged', modeChanged)],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tasks to review' }));
    expect(modeChanged).toHaveBeenCalledWith('reviewing');
  });

  it('renders loading, empty and error states', async () => {
    const status = signal<'loading' | 'success' | 'error'>('loading');
    const { fixture } = await render(TaskInsights, {
      bindings: [
        inputBinding('status', status),
        inputBinding('tasks', () => []),
      ],
    });
    expect(screen.getByText('Loading task insights…')).toBeTruthy();

    status.set('success');
    await fixture.whenStable();
    expect(screen.getByText('No tasks available')).toBeTruthy();

    status.set('error');
    await fixture.whenStable();
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
