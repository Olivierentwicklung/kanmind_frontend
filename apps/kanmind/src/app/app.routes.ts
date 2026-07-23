import { Route } from '@angular/router';
import { authGuard, landingRedirect } from '@kanmind/auth/domain';
import { NotFound } from './not-found';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: landingRedirect },
  {
    path: 'login',
    loadChildren: () =>
      import('@kanmind/auth/feature').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('@kanmind/auth/feature').then((m) => m.REGISTER_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('@kanmind/legal/feature').then((m) => m.LEGAL_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@kanmind/dashboard/feature').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'boards',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@kanmind/boards/feature').then((m) => m.BOARDS_ROUTES),
  },
  {
    path: 'board',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@kanmind/boards/feature').then((m) => m.BOARD_ROUTES),
  },
  {
    path: '**',
    loadComponent: () => NotFound,
    title: 'Page not found | KanMind',
  },
];
