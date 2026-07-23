import { inputBinding, outputBinding } from '@angular/core';
import { provideRouter } from '@angular/router';
import { fireEvent, render, screen } from '@testing-library/angular/zoneless';
import { vi } from 'vitest';
import { RegisterForm } from './register-form';

describe('RegisterForm', () => {
  it('renders accessible registration controls', async () => {
    await render(RegisterForm, { providers: [provideRouter([])] });

    expect(screen.getByRole('textbox', { name: 'Full name' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
    expect(screen.getByLabelText('Password', { exact: true })).toBeTruthy();
    expect(screen.getByLabelText('Confirm password')).toBeTruthy();
    expect(
      screen.getByRole('checkbox', { name: /I have read and agree/i }),
    ).toBeTruthy();
  });

  it('shows every required validation message after an empty submission', async () => {
    const submitted = vi.fn();
    const { fixture } = await render(RegisterForm, {
      providers: [provideRouter([])],
      bindings: [outputBinding('submitted', submitted)],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.showError('fullname')).toBe(true);
    expect(fixture.componentInstance.showError('email')).toBe(true);
    expect(fixture.componentInstance.showError('password')).toBe(true);
    expect(fixture.componentInstance.showError('privacyAccepted')).toBe(true);
  });

  it('validates the full name and matching password confirmation', async () => {
    const { fixture } = await render(RegisterForm, {
      providers: [provideRouter([])],
    });

    fireEvent.input(screen.getByLabelText('Full name'), {
      target: { value: 'Ada' },
    });
    fireEvent.blur(screen.getByLabelText('Full name'));
    fireEvent.input(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'long-enough' },
    });
    fireEvent.input(screen.getByLabelText('Confirm password'), {
      target: { value: 'different' },
    });
    fireEvent.blur(screen.getByLabelText('Confirm password'));

    expect(fixture.componentInstance.showError('fullname')).toBe(true);
    expect(fixture.componentInstance.showError('repeatedPassword')).toBe(true);
  });

  it('emits the trimmed registration API command for valid input', async () => {
    const submitted = vi.fn();
    await render(RegisterForm, {
      providers: [provideRouter([])],
      bindings: [outputBinding('submitted', submitted)],
    });

    fireEvent.input(screen.getByLabelText('Full name'), {
      target: { value: '  Ada Lovelace  ' },
    });
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: '  ada@example.com  ' },
    });
    fireEvent.input(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'long-enough' },
    });
    fireEvent.input(screen.getByLabelText('Confirm password'), {
      target: { value: 'long-enough' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /I have read and agree/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(submitted).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'long-enough',
      repeatedPassword: 'long-enough',
    });
  });

  it('renders API validation feedback and disables submission while loading', async () => {
    const error = {
      kind: 'validation' as const,
      messages: ['Email already exists'],
    };
    await render(RegisterForm, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding('loading', () => true),
        inputBinding('error', () => error),
      ],
    });

    expect(screen.getByRole('alert').textContent).toContain(
      'Email already exists',
    );
    expect(
      (screen.getByRole('button', { name: /Signing up/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
