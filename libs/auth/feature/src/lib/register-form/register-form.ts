import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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

function trimmedPattern(pattern: RegExp): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    pattern.test(control.value.trim()) ? null : { pattern: true };
}

function trimmedMinLength(length: number): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    control.value.trim().length >= length ? null : { minlength: true };
}

const passwordsMatch: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const repeatedPassword = control.get('repeatedPassword')?.value;
  return String(password).trim() === String(repeatedPassword).trim()
    ? null
    : { passwordsMismatch: true };
};

@Component({
  selector: 'lib-register-form',
  imports: [ReactiveFormsModule, RouterLink],
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

  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group(
    {
      fullname: ['', [Validators.required, trimmedPattern(fullNamePattern)]],
      email: ['', [Validators.required, trimmedPattern(emailPattern)]],
      password: ['', [Validators.required, trimmedMinLength(8)]],
      repeatedPassword: [''],
      privacyAccepted: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  submit(): void {
    this.attempted.set(true);
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      fullName: value.fullname.trim(),
      email: value.email.trim(),
      password: value.password.trim(),
      repeatedPassword: value.repeatedPassword.trim(),
    });
  }

  showError(controlName: RegisterControlName): boolean {
    const control = this.form.controls[controlName];
    const interacted = control.touched || this.attempted();
    if (controlName === 'repeatedPassword') {
      return interacted && this.form.hasError('passwordsMismatch');
    }
    return control.invalid && interacted;
  }

  togglePassword(field: 'password' | 'repeatedPassword'): void {
    if (field === 'password') {
      this.passwordVisible.update((visible) => !visible);
      return;
    }
    this.repeatedPasswordVisible.update((visible) => !visible);
  }
}
