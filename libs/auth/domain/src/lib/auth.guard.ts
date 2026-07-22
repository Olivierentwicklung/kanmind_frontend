import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  return store.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};

export const landingGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  return inject(Router).createUrlTree([
    store.isAuthenticated() ? '/dashboard' : '/login',
  ]);
};
