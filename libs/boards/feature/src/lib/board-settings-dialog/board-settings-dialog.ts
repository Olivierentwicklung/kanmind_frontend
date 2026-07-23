import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import {
  BoardDetail,
  BoardMemberError,
  BoardsLoadStatus,
  BoardsMutationStatus,
} from '@kanmind/boards/domain';
import { DialogFocusDirective } from '../dialog-focus/dialog-focus.directive';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'lib-board-settings-dialog',
  imports: [FormField, DialogFocusDirective],
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
  private readonly formModel = signal({
    title: '',
    email: '',
  });
  readonly settingsForm = form(this.formModel, (path) => {
    required(path.title);
    minLength(path.title, 3);
    maxLength(path.title, 64);
    required(path.email);
    pattern(path.email, EMAIL_PATTERN);
  });

  beginTitleEdit(): void {
    const board = this.board();
    if (!board) return;
    this.settingsForm.title().reset(board.title);
    this.editingTitle.set(true);
  }

  cancelTitleEdit(): void {
    this.editingTitle.set(false);
    this.settingsForm.title().reset('');
  }

  saveTitle(): void {
    const title = this.settingsForm.title();
    title.markAsTouched();
    if (title.invalid()) return;
    this.renamed.emit(title.value().trim());
    this.editingTitle.set(false);
  }

  inviteMember(): void {
    const email = this.settingsForm.email();
    email.markAsTouched();
    if (email.invalid()) return;
    this.memberInvited.emit(email.value().trim());
    email.reset('');
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
