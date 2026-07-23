import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { authGuard, landingRedirect } from './auth.guard';
import { AuthStore } from './auth.store';

describe('authentication routing', () => {
  function configure(isAuthenticated: boolean): Router {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { isAuthenticated: vi.fn(() => isAuthenticated) },
        },
      ],
    });
    return TestBed.inject(Router);
  }

  it('allows authenticated users through protected routes', () => {
    configure(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users from protected routes to login', () => {
    const router = configure(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it.each([
    [true, '/dashboard'],
    [false, '/login'],
  ])('redirects authenticated=%s root visits to %s', (isAuthenticated, target) => {
    const router = configure(isAuthenticated);

    const result = TestBed.runInInjectionContext(() =>
      landingRedirect({} as never, {} as never),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe(target);
  });
});
