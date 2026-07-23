import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore, RegistrationCommand } from '@kanmind/auth/domain';
import { RegisterForm } from '../register-form/register-form';

@Component({
  selector: 'lib-register-page',
  imports: [RegisterForm, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  readonly store = inject(AuthStore);

  register(command: RegistrationCommand): void {
    this.store.register(command);
  }
}
