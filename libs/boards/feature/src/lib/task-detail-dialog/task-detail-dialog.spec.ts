import { inputBinding, outputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { TaskDetailDialog } from './task-detail-dialog';

describe('TaskDetailDialog', () => {
  const task = {
    id: 21,
    boardId: 7,
    title: 'Build migration safety net',
    description: 'Protect behavior',
    status: 'to-do' as const,
    priority: 'high' as const,
    dueDate: '2099-12-31',
    commentsCount: 0,
    assignee: null,
    reviewer: null,
  };

  it('trims and emits a comment, then clears the Signal Form field', async () => {
    const commentAdded = vi.fn();
    await render(TaskDetailDialog, {
      bindings: [
        inputBinding('task', () => task),
        inputBinding('comments', () => []),
        inputBinding('currentUserName', () => 'Ada Lovelace'),
        inputBinding('commentStatus', () => 'success'),
        inputBinding('mutationStatus', () => 'idle'),
        outputBinding('commentAdded', commentAdded),
      ],
    });
    const comment = screen.getByRole('textbox', {
      name: 'Add comment',
    }) as HTMLTextAreaElement;

    fireEvent.input(comment, { target: { value: '  Ready to review  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send comment' }));

    expect(commentAdded).toHaveBeenCalledWith('Ready to review');
    expect(comment.value).toBe('');
  });

  it('rejects empty comments and submits with Enter but not Shift+Enter', async () => {
    const commentAdded = vi.fn();
    await render(TaskDetailDialog, {
      bindings: [
        inputBinding('task', () => task),
        inputBinding('comments', () => []),
        inputBinding('currentUserName', () => 'Ada Lovelace'),
        inputBinding('commentStatus', () => 'success'),
        inputBinding('mutationStatus', () => 'idle'),
        outputBinding('commentAdded', commentAdded),
      ],
    });
    const comment = screen.getByRole('textbox', {
      name: 'Add comment',
    }) as HTMLTextAreaElement;

    fireEvent.input(comment, { target: { value: '   ' } });
    fireEvent.keyDown(comment, { key: 'Enter' });
    expect(commentAdded).not.toHaveBeenCalled();

    fireEvent.input(comment, { target: { value: 'Keep editing' } });
    fireEvent.keyDown(comment, { key: 'Enter', shiftKey: true });
    expect(commentAdded).not.toHaveBeenCalled();

    fireEvent.keyDown(comment, { key: 'Enter' });
    expect(commentAdded).toHaveBeenCalledWith('Keep editing');
    expect(comment.value).toBe('');
  });

  it('disables comment submission while a mutation is loading', async () => {
    const mutationStatus = signal<'idle' | 'loading' | 'error'>('loading');
    await render(TaskDetailDialog, {
      bindings: [
        inputBinding('task', () => task),
        inputBinding('comments', () => []),
        inputBinding('currentUserName', () => 'Ada Lovelace'),
        inputBinding('commentStatus', () => 'success'),
        inputBinding('mutationStatus', mutationStatus),
      ],
    });

    const comment = screen.getByRole('textbox', {
      name: 'Add comment',
    }) as HTMLTextAreaElement;
    const send = screen.getByRole('button', {
      name: 'Send comment',
    }) as HTMLButtonElement;

    expect(comment.disabled).toBe(true);
    expect(send.disabled).toBe(true);

    mutationStatus.set('idle');
    TestBed.tick();

    expect(comment.disabled).toBe(false);
    expect(send.disabled).toBe(false);
  });
});
