import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore, LoginCommand } from '@kanmind/auth/domain';
import { LoginForm } from '../login-form/login-form';

@Component({
  selector: 'lib-login-page',
  imports: [LoginForm, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  readonly store = inject(AuthStore);

  login(command: LoginCommand): void {
    this.store.login(command);
  }
}
