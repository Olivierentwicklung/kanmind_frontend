import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApi } from './auth-api';
import { AuthRepository } from './auth-repository';

describe('AuthRepository', () => {
  const api = { login: vi.fn(), register: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [AuthRepository, { provide: AuthApi, useValue: api }],
    });
  });

  it('maps the login DTO to an application session', async () => {
    api.login.mockReturnValue(
      of({
        token: 'token',
        user_id: 7,
        email: 'ada@example.com',
        fullname: 'Ada Lovelace',
      }),
    );

    await expect(
      firstValueFrom(
        TestBed.inject(AuthRepository).login({
          email: 'ada@example.com',
          password: 'secret',
        }),
      ),
    ).resolves.toEqual({
      token: 'token',
      userId: 7,
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
    });
  });

  it('maps registration validation details without leaking HTTP errors', async () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { email: ['Email already exists'] },
          }),
      ),
    );

    await expect(
      firstValueFrom(
        TestBed.inject(AuthRepository).register({
          fullName: 'Ada',
          email: 'ada@example.com',
          password: 'secret',
          repeatedPassword: 'secret',
        }),
      ),
    ).rejects.toEqual({
      kind: 'validation',
      messages: ['Email already exists'],
    });
    expect(api.register).toHaveBeenCalledWith({
      fullname: 'Ada',
      email: 'ada@example.com',
      password: 'secret',
      repeated_password: 'secret',
    });
  });
});
