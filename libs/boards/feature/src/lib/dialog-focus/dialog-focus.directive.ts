import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Directive,
  ElementRef,
  inject,
  OnDestroy,
  output,
} from '@angular/core';

const FOCUSABLE_SELECTOR = [
  '[data-dialog-initial-focus]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface BackgroundElementState {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
}

@Directive({
  selector: '[libDialogFocus]',
  standalone: true,
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class DialogFocusDirective implements OnDestroy {
  readonly escapePressed = output<void>();

  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly previouslyFocused =
    this.document.activeElement instanceof HTMLElement
      ? this.document.activeElement
      : null;
  private readonly backgroundState = this.makeBackgroundInert();

  constructor() {
    afterNextRender(() => this.initialFocus()?.focus());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.escapePressed.emit();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.element.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    for (const state of this.backgroundState) {
      state.element.inert = state.inert;
      if (state.ariaHidden === null) {
        state.element.removeAttribute('aria-hidden');
      } else {
        state.element.setAttribute('aria-hidden', state.ariaHidden);
      }
    }
    this.previouslyFocused?.focus();
  }

  private initialFocus(): HTMLElement | null {
    return (
      this.element.querySelector<HTMLElement>('[data-dialog-initial-focus]') ??
      this.focusableElements()[0] ??
      null
    );
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(
      this.element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter(
      (element) =>
        !element.hidden && element.getAttribute('aria-hidden') !== 'true',
    );
  }

  private makeBackgroundInert(): BackgroundElementState[] {
    const states: BackgroundElementState[] = [];
    let current: HTMLElement | null = this.element;

    while (
      current.parentElement &&
      current.parentElement !== this.document.body
    ) {
      for (const sibling of Array.from(current.parentElement.children)) {
        if (sibling === current || !(sibling instanceof HTMLElement)) continue;
        states.push({
          element: sibling,
          inert: sibling.inert,
          ariaHidden: sibling.getAttribute('aria-hidden'),
        });
        sibling.inert = true;
        sibling.setAttribute('aria-hidden', 'true');
      }
      current = current.parentElement;
    }

    return states;
  }
}
