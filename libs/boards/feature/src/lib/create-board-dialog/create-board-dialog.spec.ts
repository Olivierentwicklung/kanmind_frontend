import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { CreateBoardDialog } from './create-board-dialog';

describe('CreateBoardDialog', () => {
  it('validates title and email before emitting intent', async () => {
    const memberInvited = vi.fn();
    const submitted = vi.fn();
    await render(CreateBoardDialog, {
      bindings: [
        inputBinding('members', () => []),
        inputBinding('memberStatus', () => 'idle'),
        inputBinding('mutationStatus', () => 'idle'),
        inputBinding('memberError', () => null),
        outputBinding('memberInvited', memberInvited),
        outputBinding('submitted', submitted),
      ],
    });

    fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    TestBed.tick();
    expect(screen.getByText('Title must be between 3 and 64 characters long.')).toBeTruthy();
    expect(submitted).not.toHaveBeenCalled();

    fireEvent.input(screen.getByLabelText('E-mail'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
    TestBed.tick();
    expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    expect(memberInvited).not.toHaveBeenCalled();
  });

  it('renders members and emits a valid create command', async () => {
    const submitted = vi.fn();
    await render(CreateBoardDialog, {
      bindings: [
        inputBinding('members', () => [
          { id: 43, email: 'grace@example.com', fullName: 'Grace Hopper' },
        ]),
        inputBinding('memberStatus', () => 'idle'),
        inputBinding('mutationStatus', () => 'idle'),
        inputBinding('memberError', () => null),
        outputBinding('submitted', submitted),
      ],
    });

    expect(screen.getByText('grace@example.com')).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Title'), {
      target: { value: 'Angular Migration' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(submitted).toHaveBeenCalledWith('Angular Migration');
  });
});
