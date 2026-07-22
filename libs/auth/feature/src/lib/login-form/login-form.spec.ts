import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginForm], providers: [provideRouter([])] }).compileComponents();
  });

  it('renders accessible login controls', () => {
    const fixture = TestBed.createComponent(LoginForm); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('label[for="email"]')?.textContent).toContain('Email');
    expect(element.querySelector('label[for="password"]')?.textContent).toContain('Password');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Log in');
  });

  it('shows validation after an invalid submission and emits nothing', () => {
    const fixture = TestBed.createComponent(LoginForm); fixture.detectChanges();
    let emitted = false; fixture.componentInstance.submitted.subscribe(() => emitted = true);
    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(emitted).toBe(false);
    expect(fixture.componentInstance.showError('email')).toBe(true);
    expect(fixture.componentInstance.showError('password')).toBe(true);
  });

  it('toggles password visibility', () => {
    const fixture = TestBed.createComponent(LoginForm); fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.password-toggle');
    button?.click(); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#password')?.type).toBe('text');
    expect(button?.getAttribute('aria-label')).toBe('Hide password');
  });

  it('emits a typed command for valid input', () => {
    const fixture = TestBed.createComponent(LoginForm); fixture.detectChanges();
    const command = { email: 'user@example.com', password: 'secret' };
    fixture.componentInstance.form.setValue(command);
    let emitted: unknown; fixture.componentInstance.submitted.subscribe((value) => emitted = value);
    fixture.componentInstance.submit();
    expect(emitted).toEqual(command);
  });

  it('disables actions while loading', () => {
    const fixture = TestBed.createComponent(LoginForm); fixture.componentRef.setInput('loading', true); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button:disabled').length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Logging in');
  });
});
