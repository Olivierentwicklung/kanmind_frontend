import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { BoardSettingsDialog } from './board-settings-dialog';

describe('BoardSettingsDialog', () => {
  const board = {
    id: 7,
    title: 'Migration Board',
    ownerId: 42,
    memberCount: 2,
    ticketCount: 3,
    tasksToDoCount: 1,
    highPriorityTaskCount: 1,
    members: [
      { id: 42, email: 'ada@example.com', fullName: 'Ada Lovelace' },
      { id: 43, email: 'grace@example.com', fullName: 'Grace Hopper' },
    ],
  };

  it('labels the owner and only allows removable members to be removed', async () => {
    const removed = vi.fn();
    await render(BoardSettingsDialog, {
      bindings: [
        inputBinding('board', () => board),
        inputBinding('detailStatus', () => 'success'),
        inputBinding('memberStatus', () => 'idle'),
        inputBinding('mutationStatus', () => 'idle'),
        inputBinding('memberError', () => null),
        outputBinding('memberRemoved', removed),
      ],
    });

    expect(screen.getByText('ada@example.com (owner)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove ada@example.com' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remove grace@example.com' }));
    expect(removed).toHaveBeenCalledWith(43);
  });

  it('renames and requires confirmation before deletion', async () => {
    const renamed = vi.fn();
    const deleted = vi.fn();
    await render(BoardSettingsDialog, {
      bindings: [
        inputBinding('board', () => board),
        inputBinding('detailStatus', () => 'success'),
        inputBinding('memberStatus', () => 'idle'),
        inputBinding('mutationStatus', () => 'idle'),
        inputBinding('memberError', () => null),
        outputBinding('renamed', renamed),
        outputBinding('deleted', deleted),
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit board title' }));
    TestBed.tick();
    fireEvent.input(screen.getByLabelText('Board title'), {
      target: { value: 'Renamed Board' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save title' }));
    expect(renamed).toHaveBeenCalledWith('Renamed Board');

    fireEvent.click(screen.getByRole('button', { name: 'Delete board' }));
    TestBed.tick();
    expect(deleted).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete board' }));
    expect(deleted).toHaveBeenCalled();
  });
});
