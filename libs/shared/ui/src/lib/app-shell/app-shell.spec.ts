import { provideRouter } from '@angular/router';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders guest navigation without authenticated actions', async () => {
    await render(AppShell, { providers: [provideRouter([])] });

    expect(screen.getByRole('link', { name: 'Log in' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });

  it('renders authenticated navigation and emits logout intent', async () => {
    const logoutRequested = vi.fn();
    const view = await render(AppShell, {
      providers: [provideRouter([])],
    });
    view.fixture.componentRef.setInput('fullName', 'Ada Lovelace');
    view.fixture.componentInstance.logoutRequested.subscribe(logoutRequested);
    await view.fixture.whenStable();

    expect(screen.getByLabelText('Signed in as Ada Lovelace').textContent?.trim()).toBe('AL');
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(logoutRequested).toHaveBeenCalledOnce();
  });
});
