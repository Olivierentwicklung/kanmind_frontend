import { inputBinding, outputBinding } from '@angular/core';
import { provideRouter } from '@angular/router';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  it('renders accessible login controls', async () => {
    await render(LoginForm, { providers: [provideRouter([])] });

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
  });

  it('shows validation after an invalid submission and emits nothing', async () => {
    const submitted = vi.fn();
    const { fixture } = await render(LoginForm, {
      providers: [provideRouter([])],
      bindings: [outputBinding('submitted', submitted)],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await fixture.whenStable();

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.showError('email')).toBe(true);
    expect(fixture.componentInstance.showError('password')).toBe(true);
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(
      screen.getByLabelText('Email').getAttribute('aria-describedby'),
    ).toBe('email-error');
    expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('toggles password visibility', async () => {
    const { fixture } = await render(LoginForm, {
      providers: [provideRouter([])],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    await fixture.whenStable();

    expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe(
      'text',
    );
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  });

  it('emits a typed command for valid input', async () => {
    const command = { email: 'user@example.com', password: 'secret' };
    const submitted = vi.fn();
    await render(LoginForm, {
      providers: [provideRouter([])],
      bindings: [outputBinding('submitted', submitted)],
    });

    fireEvent.input(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: command.email },
    });
    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: command.password },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(submitted).toHaveBeenCalledWith(command);
  });

  it('disables actions while loading', async () => {
    const { fixture } = await render(LoginForm, {
      providers: [provideRouter([])],
      bindings: [inputBinding('loading', () => true)],
    });
    await fixture.whenStable();

    expect(
      screen
        .getAllByRole('button')
        .filter((button) => (button as HTMLButtonElement).disabled),
    ).toHaveLength(2);
    expect(screen.getByText(/Logging in/)).toBeTruthy();
  });
});
