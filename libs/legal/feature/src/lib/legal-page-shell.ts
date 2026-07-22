import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-legal-page-shell',
  imports: [RouterLink],
  template: `
    <header class="main_header w_full"><a routerLink="/" aria-label="KanMind home"><img src="/assets/icons/logo_icon.svg" alt="KanMind"></a></header>
    <main class="w_full d_flex_ss_gl font_white_color">
      <nav class="font_sec_color w_full" aria-label="Breadcrumb"><a class="link_secondary" routerLink="/dashboard">Dashboard</a> / <span>{{ title() }}</span></nav>
      <h1 class="font_prime_color">{{ title() }}</h1>
      <ng-content />
    </main>
    <footer class="main_footer w_full"><nav class="d_flex_cs_gl" aria-label="Legal"><a routerLink="/privacy" class="link">Privacy Policy</a><a routerLink="/imprint" class="link">Imprint</a></nav></footer>
  `,
  styles: [`:host { display: flex; flex-direction: column; min-height: 100vh; width: 100%; } main { flex: 1; align-items: flex-start; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageShell {
  readonly title = input.required<string>();
}
