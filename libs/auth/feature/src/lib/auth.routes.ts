import { Routes } from '@angular/router';
import { LoginPage } from './login-page/login-page';

export const AUTH_ROUTES: Routes = [{ path: '', component: LoginPage, title: 'Log in | KanMind' }];

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./register-page/register-page').then((m) => m.RegisterPage),
    title: 'Sign up | KanMind',
  },
];
