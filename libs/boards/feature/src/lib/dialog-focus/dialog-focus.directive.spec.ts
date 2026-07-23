import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { DialogFocusDirective } from './dialog-focus.directive';

@Component({
  imports: [DialogFocusDirective],
  template: `
    <button type="button" (click)="open.set(true)">Open dialog</button>
    @if (open()) {
      <section
        role="dialog"
        aria-label="Example dialog"
        tabindex="-1"
        libDialogFocus
        (escapePressed)="open.set(false)"
      >
        <button type="button" data-dialog-initial-focus>First action</button>
        <button type="button">Last action</button>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogFocusTestHost {
  readonly open = signal(false);
}

describe('DialogFocusDirective', () => {
  it('focuses the dialog and restores focus to its trigger after Escape', async () => {
    const { fixture } = await render(DialogFocusTestHost);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });

    trigger.focus();
    fireEvent.click(trigger);
    await fixture.whenStable();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'First action' }),
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await fixture.whenStable();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps forward and reverse tab navigation inside the dialog', async () => {
    const { fixture } = await render(DialogFocusTestHost);
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    await fixture.whenStable();

    const dialog = screen.getByRole('dialog');
    const first = screen.getByRole('button', { name: 'First action' });
    const last = screen.getByRole('button', { name: 'Last action' });

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
