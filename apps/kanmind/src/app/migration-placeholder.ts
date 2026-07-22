import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-migration-placeholder',
  imports: [RouterLink],
  template: `<main class="placeholder"><img src="/assets/icons/logo_icon.svg" alt="KanMind"><h1>{{ title() }}</h1><p>This area is being migrated to Angular. Its behavior remains protected in the legacy regression suite.</p><a routerLink="/login">Back to login</a></main>`,
  styles: [`.placeholder { min-height: 100vh; padding: 3rem 1rem; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; color: var(--font_white_color); text-align: center; } img { width: 64px; } h1 { color: var(--font-prime-color); } a { color: var(--link-hover-color); }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigrationPlaceholder { readonly title = input('Migration in progress'); }
