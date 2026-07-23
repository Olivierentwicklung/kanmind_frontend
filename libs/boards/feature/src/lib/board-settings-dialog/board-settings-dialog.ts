import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BoardDetail,
  BoardMemberError,
  BoardsLoadStatus,
  BoardsMutationStatus,
} from '@kanmind/boards/domain';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'lib-board-settings-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './board-settings-dialog.html',
  styleUrl: './board-settings-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardSettingsDialog {
  readonly board = input.required<BoardDetail | null>();
  readonly detailStatus = input.required<BoardsLoadStatus>();
  readonly memberStatus = input.required<BoardsLoadStatus>();
  readonly mutationStatus = input.required<BoardsMutationStatus>();
  readonly memberError = input.required<BoardMemberError | null>();

  readonly closed = output<void>();
  readonly memberInvited = output<string>();
  readonly memberRemoved = output<number>();
  readonly renamed = output<string>();
  readonly deleted = output<void>();

  readonly editingTitle = signal(false);
  readonly confirmingDelete = signal(false);
  readonly title = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3), Validators.maxLength(64)],
  });
  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
  });

  beginTitleEdit(): void {
    const board = this.board();
    if (!board) return;
    this.title.setValue(board.title);
    this.title.markAsUntouched();
    this.editingTitle.set(true);
  }

  cancelTitleEdit(): void {
    this.editingTitle.set(false);
    this.title.reset();
  }

  saveTitle(): void {
    this.title.markAsTouched();
    if (this.title.invalid) return;
    this.renamed.emit(this.title.value.trim());
    this.editingTitle.set(false);
  }

  inviteMember(): void {
    this.email.markAsTouched();
    if (this.email.invalid) return;
    this.memberInvited.emit(this.email.value.trim());
    this.email.reset();
  }

  memberErrorMessage(): string {
    switch (this.memberError()) {
      case 'duplicate':
        return 'This e-mail address is already a member.';
      case 'not-found':
        return 'This e-mail address does not exist.';
      case 'network':
        return 'The member lookup failed. Check your connection and try again.';
      case 'unexpected':
        return 'The member could not be added.';
      default:
        return '';
    }
  }
}
