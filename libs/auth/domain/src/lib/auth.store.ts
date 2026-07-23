import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthRepository,
  AuthRepositoryError,
  SessionStorage,
} from '@kanmind/auth/data-access';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
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

function toAuthError(error: unknown): AuthError {
  if (!isAuthRepositoryError(error)) return 'unexpected';
  const repositoryError = error;
  if (repositoryError.kind === 'network') return 'network';
  if (repositoryError.kind === 'invalid-credentials')
    return 'invalidCredentials';
  return 'unexpected';
}

function toRegistrationError(error: unknown): RegistrationError {
  if (!isAuthRepositoryError(error)) return { kind: 'unexpected' };
  const repositoryError = error;
  if (repositoryError.kind === 'network') return { kind: 'network' };
  if (repositoryError.kind === 'validation') return repositoryError;
  return { kind: 'unexpected' };
}

function isAuthRepositoryError(error: unknown): error is AuthRepositoryError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    ['invalid-credentials', 'validation', 'network', 'unexpected'].includes(
      String(error.kind),
    )
  );
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ session }) => ({
    isAuthenticated: computed(() => session() !== null),
  })),
  withMethods((store) => {
    const repository = inject(AuthRepository);
    const storage = inject(SessionStorage);
    const router = inject(Router);

    const login = rxMethod<LoginCommand>(
      pipe(
        exhaustMap((command) => {
          patchState(store, {
            status: 'loading',
            error: null,
            registrationError: null,
          });
          return repository.login(command).pipe(
            tap((session: AuthSession) => {
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
          patchState(store, {
            status: 'loading',
            error: null,
            registrationError: null,
          });
          return repository.register(command).pipe(
            tap((session: AuthSession) => {
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
        patchState(
          store,
          session
            ? { session, status: 'authenticated', error: null }
            : initialState,
        );
      },
    };
  }),
);
