import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi, LoginResponseDto, SessionStorage } from '@kanmind/auth/data-access';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, exhaustMap, pipe, tap } from 'rxjs';
import {
  AuthError,
  AuthSession,
  AuthStatus,
  GUEST_LOGIN,
  LoginCommand,
  RegistrationCommand,
  RegistrationError,
} from './auth.models';

interface AuthState {
  session: AuthSession | null;
  status: AuthStatus;
  error: AuthError | null;
  registrationError: RegistrationError | null;
}

const initialState: AuthState = {
  session: null,
  status: 'idle',
  error: null,
  registrationError: null,
};

function toSession(dto: LoginResponseDto): AuthSession {
  return {
    token: dto.token,
    userId: dto.user_id,
    email: dto.email,
    fullName: dto.fullname,
  };
}

function toAuthError(error: unknown): AuthError {
  if (!(error instanceof HttpErrorResponse)) return 'unexpected';
  if (error.status === 0) return 'network';
  if (error.status === 400 || error.status === 401) return 'invalidCredentials';
  return 'unexpected';
}

function validationMessages(error: HttpErrorResponse): readonly string[] {
  if (!error.error || typeof error.error !== 'object' || Array.isArray(error.error)) return [];

  return Object.values(error.error as Record<string, unknown>).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((message): message is string => typeof message === 'string');
    return [];
  });
}

function toRegistrationError(error: unknown): RegistrationError {
  if (!(error instanceof HttpErrorResponse)) return { kind: 'unexpected' };
  if (error.status === 0) return { kind: 'network' };
  if (error.status === 400) {
    const messages = validationMessages(error);
    return messages.length > 0 ? { kind: 'validation', messages } : { kind: 'unexpected' };
  }
  return { kind: 'unexpected' };
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ session }) => ({
    isAuthenticated: computed(() => session() !== null),
  })),
  withMethods((store) => {
    const api = inject(AuthApi);
    const storage = inject(SessionStorage);
    const router = inject(Router);

    const login = rxMethod<LoginCommand>(
      pipe(
        exhaustMap((command) => {
          patchState(store, { status: 'loading', error: null, registrationError: null });
          return api.login(command).pipe(
            tap((dto) => {
              const session = toSession(dto);
              storage.write(session);
              patchState(store, { session, status: 'authenticated', error: null, registrationError: null });
              void router.navigate(['/dashboard']);
            }),
            catchError((error: unknown) => {
              patchState(store, { status: 'error', error: toAuthError(error) });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    const register = rxMethod<RegistrationCommand>(
      pipe(
        exhaustMap((command) => {
          patchState(store, { status: 'loading', error: null, registrationError: null });
          return api.register(command).pipe(
            tap((dto) => {
              const session = toSession(dto);
              storage.write(session);
              patchState(store, {
                session,
                status: 'authenticated',
                error: null,
                registrationError: null,
              });
              void router.navigate(['/dashboard']);
            }),
            catchError((error: unknown) => {
              patchState(store, {
                status: 'error',
                registrationError: toRegistrationError(error),
              });
              return EMPTY;
            }),
          );
        }),
      ),
    );

    return {
      login,
      register,
      guestLogin: () => login(GUEST_LOGIN),
      logout: () => {
        storage.clear();
        patchState(store, initialState);
        void router.navigate(['/login']);
      },
    };
  }),
  withHooks((store) => {
    const storage = inject(SessionStorage);
    return {
      onInit() {
        const session = storage.read();
        patchState(store, session
          ? { session, status: 'authenticated', error: null }
          : initialState);
      },
    };
  }),
);
