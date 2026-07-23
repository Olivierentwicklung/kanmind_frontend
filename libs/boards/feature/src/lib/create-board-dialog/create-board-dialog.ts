import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BoardMember,
  BoardMemberError,
  BoardsLoadStatus,
  BoardsMutationStatus,
} from '@kanmind/boards/domain';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'lib-create-board-dialog',
  imports: [ReactiveFormsModule],
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

  readonly title = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3), Validators.maxLength(64)],
  });
  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
  });

  inviteMember(): void {
    this.email.markAsTouched();
    if (this.email.invalid) return;
    this.memberInvited.emit(this.email.value.trim());
    this.email.reset();
  }

  createBoard(): void {
    this.title.markAsTouched();
    if (this.title.invalid) return;
    this.submitted.emit(this.title.value.trim());
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
