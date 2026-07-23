import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthApi, LoginResponseDto, SessionStorage } from '@kanmind/auth/data-access';
import { Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  const storage = { read: vi.fn(), write: vi.fn(), clear: vi.fn(), token: vi.fn() };
  const router = { navigate: vi.fn() };
  const api = { login: vi.fn(), register: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks(); storage.read.mockReturnValue(null);
    TestBed.configureTestingModule({ providers: [AuthStore, { provide: AuthApi, useValue: api }, { provide: SessionStorage, useValue: storage }, { provide: Router, useValue: router }] });
  });

  it('hydrates an existing session synchronously', () => {
    const session = { token: 't', userId: 1, email: 'a@b.test', fullName: 'A B' };
    storage.read.mockReturnValue(session);
    const store = TestBed.inject(AuthStore);
    expect(store.session()).toEqual(session);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('persists the adapted response and navigates after login', () => {
    const request = new Subject<LoginResponseDto>(); api.login.mockReturnValue(request);
    const store = TestBed.inject(AuthStore);
    store.login({ email: 'a@b.test', password: 'pw' });
    expect(store.status()).toBe('loading');
    request.next({ token: 't', user_id: 4, email: 'a@b.test', fullname: 'A B' }); request.complete();
    expect(storage.write).toHaveBeenCalledWith({ token: 't', userId: 4, email: 'a@b.test', fullName: 'A B' });
    expect(store.status()).toBe('authenticated');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('ignores duplicate submissions while the first request is active', () => {
    api.login.mockReturnValue(new Subject());
    const store = TestBed.inject(AuthStore);
    store.login({ email: 'a@b.test', password: 'pw' });
    store.login({ email: 'a@b.test', password: 'pw' });
    expect(api.login).toHaveBeenCalledTimes(1);
  });

  it('maps rejected credentials to an application error', () => {
    api.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const store = TestBed.inject(AuthStore);
    store.login({ email: 'a@b.test', password: 'bad' });
    expect(store.error()).toBe('invalidCredentials');
    expect(store.status()).toBe('error');
  });

  it('registers, persists the session and navigates to the dashboard', () => {
    const request = new Subject<LoginResponseDto>();
    api.register.mockReturnValue(request);
    const store = TestBed.inject(AuthStore);
    const command = {
      fullname: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'long-enough',
      repeated_password: 'long-enough',
    };

    store.register(command);
    expect(store.status()).toBe('loading');
    request.next({ token: 'new', user_id: 8, email: command.email, fullname: command.fullname });
    request.complete();

    expect(api.register).toHaveBeenCalledWith(command);
    expect(storage.write).toHaveBeenCalledWith({
      token: 'new',
      userId: 8,
      email: command.email,
      fullName: command.fullname,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('exposes registration validation messages without transport details', () => {
    api.register.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { email: ['Email already exists'] },
    })));
    const store = TestBed.inject(AuthStore);

    store.register({
      fullname: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'long-enough',
      repeated_password: 'long-enough',
    });

    expect(store.registrationError()).toEqual({
      kind: 'validation',
      messages: ['Email already exists'],
    });
    expect(store.status()).toBe('error');
  });
});
