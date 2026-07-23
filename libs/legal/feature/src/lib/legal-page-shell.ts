import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@kanmind/auth/domain';
import { AppShell } from '@kanmind/shared/ui';

@Component({
  selector: 'lib-legal-page-shell',
  imports: [AppShell, RouterLink],
  template: `
    <lib-app-shell
      [fullName]="authStore.session()?.fullName ?? null"
      (logoutRequested)="authStore.logout()"
    >
      <main class="w_full d_flex_ss_gl font_white_color">
        @if (authStore.isAuthenticated()) {
          <nav class="font_sec_color w_full" aria-label="Breadcrumb">
            <a class="link_secondary" routerLink="/dashboard">Dashboard</a>
            / <span>{{ title() }}</span>
          </nav>
        }
        <h1 class="font_prime_color">{{ title() }}</h1>
        <ng-content />
      </main>
    </lib-app-shell>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        width: 100%;
      }
      main {
        flex: 1;
        align-items: flex-start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageShell {
  readonly title = input.required<string>();
  readonly authStore = inject(AuthStore);
}
