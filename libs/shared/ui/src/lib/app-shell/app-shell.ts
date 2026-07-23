import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-app-shell',
  imports: [RouterLink],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  readonly fullName = input<string | null>(null);
  readonly logoutRequested = output<void>();
  readonly initials = computed(() =>
    (this.fullName() ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toLocaleUpperCase())
      .join(''),
  );
}
