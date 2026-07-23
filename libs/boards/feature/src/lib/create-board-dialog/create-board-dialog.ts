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
  BoardMember,
  BoardMemberError,
  BoardsLoadStatus,
  BoardsMutationStatus,
} from '@kanmind/boards/domain';
import { DialogFocusDirective } from '../dialog-focus/dialog-focus.directive';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'lib-create-board-dialog',
  imports: [FormField, DialogFocusDirective],
  templateUrl: './create-board-dialog.html',
  styleUrl: './create-board-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBoardDialog {
  readonly members = input.required<readonly BoardMember[]>();
  readonly memberStatus = input.required<BoardsLoadStatus>();
  readonly mutationStatus = input.required<BoardsMutationStatus>();
  readonly memberError = input.required<BoardMemberError | null>();

  readonly closed = output<void>();
  readonly memberInvited = output<string>();
  readonly memberRemoved = output<number>();
  readonly submitted = output<string>();

  private readonly formModel = signal({
    title: '',
    email: '',
  });
  readonly boardForm = form(this.formModel, (path) => {
    required(path.title);
    minLength(path.title, 3);
    maxLength(path.title, 64);
    required(path.email);
    pattern(path.email, EMAIL_PATTERN);
  });

  inviteMember(): void {
    const email = this.boardForm.email();
    email.markAsTouched();
    if (email.invalid()) return;
    this.memberInvited.emit(email.value().trim());
    email.reset('');
  }

  createBoard(): void {
    const title = this.boardForm.title();
    title.markAsTouched();
    if (title.invalid()) return;
    this.submitted.emit(title.value().trim());
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
