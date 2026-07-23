import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { AuthError, LoginCommand } from '@kanmind/auth/domain';

@Component({
  selector: 'lib-login-form',
  imports: [FormField, RouterLink],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  readonly loading = input(false);
  readonly error = input<AuthError | null>(null);
  readonly submitted = output<LoginCommand>();
  readonly guestRequested = output<void>();
  readonly passwordVisible = signal(false);
  readonly attempted = signal(false);

  private readonly model = signal({
    email: '',
    password: '',
  });
  readonly form = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  });

  submit(): void {
    this.attempted.set(true);
    if (this.form().invalid() || this.loading()) {
      this.form().markAsTouched();
      return;
    }
    this.submitted.emit(this.model());
  }

  showError(controlName: 'email' | 'password'): boolean {
    const field = this.form[controlName]();
    return field.invalid() && (field.touched() || this.attempted());
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }
}
