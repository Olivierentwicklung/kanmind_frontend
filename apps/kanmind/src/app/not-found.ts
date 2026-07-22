import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<main><h1>Page not found</h1><p>The page you requested does not exist.</p><a routerLink="/">Go to KanMind</a></main>`,
  styles: [`main { min-height: 100vh; display: grid; place-content: center; gap: 1rem; text-align: center; color: var(--font_white_color); } h1, a { color: var(--font-prime-color); }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
