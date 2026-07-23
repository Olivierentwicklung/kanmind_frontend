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

    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'ab' } });
    const form = screen.getByRole('dialog').querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);
    expect(
      await screen.findByText('Title must be at least 3 characters long.'),
    ).toBeTruthy();
    expect(await screen.findByText('Due date is required.')).toBeTruthy();
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

    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'Angular parity' } });
    fireEvent.input(screen.getByLabelText('Description'), { target: { value: 'Protect behavior' } });
    fireEvent.input(screen.getByLabelText('Due date'), { target: { value: '2099-09-30' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } });
    const form = screen.getByRole('dialog').querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Angular parity',
        status: 'review',
        priority: 'high',
        dueDate: '2099-09-30',
      }),
    );
  });
});
