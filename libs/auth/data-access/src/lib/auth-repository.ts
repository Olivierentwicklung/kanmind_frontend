import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  AuthApi,
  LoginRequestDto,
  LoginResponseDto,
  RegistrationRequestDto,
} from './auth-api';

export interface AuthSessionData {
  token: string;
  userId: number;
  email: string;
  fullName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  repeatedPassword: string;
}

export type AuthRepositoryError =
  | { kind: 'invalid-credentials' }
  | { kind: 'validation'; messages: readonly string[] }
  | { kind: 'network' }
  | { kind: 'unexpected' };

function toSession(dto: LoginResponseDto): AuthSessionData {
  return {
    token: dto.token,
    userId: dto.user_id,
    email: dto.email,
    fullName: dto.fullname,
  };
}

function validationMessages(error: HttpErrorResponse): readonly string[] {
  if (
    !error.error ||
    typeof error.error !== 'object' ||
    Array.isArray(error.error)
  )
    return [];

  return Object.values(error.error as Record<string, unknown>).flatMap(
    (value) => {
      if (typeof value === 'string') return [value];
      return Array.isArray(value)
        ? value.filter(
            (message): message is string => typeof message === 'string',
          )
        : [];
    },
  );
}

function mapError(
  error: unknown,
  operation: 'login' | 'register',
): AuthRepositoryError {
  if (!(error instanceof HttpErrorResponse)) return { kind: 'unexpected' };
  if (error.status === 0) return { kind: 'network' };
  if (operation === 'login' && (error.status === 400 || error.status === 401)) {
    return { kind: 'invalid-credentials' };
  }
  if (operation === 'register' && error.status === 400) {
    const messages = validationMessages(error);
    return messages.length
      ? { kind: 'validation', messages }
      : { kind: 'unexpected' };
  }
  return { kind: 'unexpected' };
}

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly api = inject(AuthApi);

  login(command: LoginData): Observable<AuthSessionData> {
    const request: LoginRequestDto = {
      email: command.email,
      password: command.password,
    };
    return this.api.login(request).pipe(
      map(toSession),
      catchError((error: unknown) =>
        throwError(() => mapError(error, 'login')),
      ),
    );
  }

  register(command: RegistrationData): Observable<AuthSessionData> {
    const request: RegistrationRequestDto = {
      fullname: command.fullName,
      email: command.email,
      password: command.password,
      repeated_password: command.repeatedPassword,
    };
    return this.api.register(request).pipe(
      map(toSession),
      catchError((error: unknown) =>
        throwError(() => mapError(error, 'register')),
      ),
    );
  }
}
