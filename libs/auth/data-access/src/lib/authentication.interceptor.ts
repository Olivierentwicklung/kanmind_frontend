import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStorage } from './session-storage';

export const authenticationInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(SessionStorage).token();
  return next(
    token
      ? request.clone({ setHeaders: { Authorization: `Token ${token}` } })
      : request,
  );
};
