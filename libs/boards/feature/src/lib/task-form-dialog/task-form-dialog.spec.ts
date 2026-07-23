import { inputBinding, outputBinding } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { TaskFormDialog } from './task-form-dialog';

describe('TaskFormDialog', () => {
  const members = [
    { id: 42, email: 'ada@example.com', fullName: 'Ada Lovelace' },
  ];

  it('validates required task fields', async () => {
    await render(TaskFormDialog, {
      bindings: [
        inputBinding('mode', () => 'create'),
        inputBinding('task', () => null),
        inputBinding('members', () => members),
        inputBinding('initialStatus', () => 'to-do'),
        inputBinding('mutationStatus', () => 'idle'),
      ],
    });

    fireEvent.input(screen.getByLabelText('Title'), {
      target: { value: 'ab' },
    });
    const form = screen.getByRole('dialog').querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);
    expect(
      await screen.findByText('Title must be at least 3 characters long.'),
    ).toBeTruthy();
    expect(await screen.findByText('Due date is required.')).toBeTruthy();
    expect(screen.getByLabelText('Title').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(
      screen.getByLabelText('Title').getAttribute('aria-describedby'),
    ).toBe('task-title-error');
    expect(screen.getByLabelText('Due date').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('focuses the first field, traps focus and closes on Escape', async () => {
    const closed = vi.fn();
    const { fixture } = await render(TaskFormDialog, {
      bindings: [
        inputBinding('mode', () => 'create'),
        inputBinding('task', () => null),
        inputBinding('members', () => members),
        inputBinding('initialStatus', () => 'to-do'),
        inputBinding('mutationStatus', () => 'idle'),
        outputBinding('closed', closed),
      ],
    });
    await fixture.whenStable();

    expect(document.activeElement).toBe(screen.getByLabelText('Title'));

    const submit = screen.getByRole('button', { name: 'Add task' });
    submit.focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close task form' }),
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(closed).toHaveBeenCalledOnce();
  });

  it('emits the complete save command', async () => {
    const saved = vi.fn();
    await render(TaskFormDialog, {
      bindings: [
        inputBinding('mode', () => 'create'),
        inputBinding('task', () => null),
        inputBinding('members', () => members),
        inputBinding('initialStatus', () => 'review'),
        inputBinding('mutationStatus', () => 'idle'),
        outputBinding('saved', saved),
      ],
    });

    fireEvent.input(screen.getByLabelText('Title'), {
      target: { value: 'Angular parity' },
    });
    fireEvent.input(screen.getByLabelText('Description'), {
      target: { value: 'Protect behavior' },
    });
    fireEvent.input(screen.getByLabelText('Due date'), {
      target: { value: '2099-09-30' },
    });
    fireEvent.input(screen.getByLabelText('Priority'), {
      target: { value: 'high' },
    });
    fireEvent.input(screen.getByLabelText('Assignee'), {
      target: { value: '42' },
    });
    const form = screen.getByRole('dialog').querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Angular parity',
        status: 'review',
        priority: 'high',
        assigneeId: 42,
        reviewerId: null,
        dueDate: '2099-09-30',
      }),
    );
  });
});
