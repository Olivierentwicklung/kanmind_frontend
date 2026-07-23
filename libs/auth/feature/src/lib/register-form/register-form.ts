import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { RegistrationCommand, RegistrationError } from '@kanmind/auth/domain';

type RegisterControlName =
  | 'fullname'
  | 'email'
  | 'password'
  | 'repeatedPassword'
  | 'privacyAccepted';

const fullNamePattern = /^[a-zäöüß]+(?: [a-zäöüß]+){1,2}$/i;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'lib-register-form',
  imports: [FormField, RouterLink],
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
  readonly loading = input(false);
  readonly error = input<RegistrationError | null>(null);
  readonly submitted = output<RegistrationCommand>();
  readonly passwordVisible = signal(false);
  readonly repeatedPasswordVisible = signal(false);
  readonly attempted = signal(false);

  private readonly model = signal({
    fullname: '',
    email: '',
    password: '',
    repeatedPassword: '',
    privacyAccepted: false,
  });
  readonly form = form(this.model, (path) => {
    required(path.fullname);
    validate(path.fullname, ({ value }) =>
      fullNamePattern.test(value().trim()) ? undefined : { kind: 'pattern' },
    );
    required(path.email);
    validate(path.email, ({ value }) =>
      emailPattern.test(value().trim()) ? undefined : { kind: 'pattern' },
    );
    required(path.password);
    validate(path.password, ({ value }) =>
      value().trim().length >= 8 ? undefined : { kind: 'minlength' },
    );
    validate(path.repeatedPassword, ({ value, valueOf }) =>
      value().trim() === valueOf(path.password).trim()
        ? undefined
        : { kind: 'passwordsMismatch' },
    );
    required(path.privacyAccepted);
  });

  submit(): void {
    this.attempted.set(true);
    if (this.form().invalid() || this.loading()) {
      this.form().markAsTouched();
      return;
    }

    const value = this.model();
    this.submitted.emit({
      fullName: value.fullname.trim(),
      email: value.email.trim(),
      password: value.password.trim(),
      repeatedPassword: value.repeatedPassword.trim(),
    });
  }

  showError(controlName: RegisterControlName): boolean {
    const field = this.form[controlName]();
    return field.invalid() && (field.touched() || this.attempted());
  }

  togglePassword(field: 'password' | 'repeatedPassword'): void {
    if (field === 'password') {
      this.passwordVisible.update((visible) => !visible);
      return;
    }
    this.repeatedPasswordVisible.update((visible) => !visible);
  }
}
