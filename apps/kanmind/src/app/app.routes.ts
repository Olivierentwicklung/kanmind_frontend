import { Route } from '@angular/router';
import { authGuard, landingRedirect } from '@kanmind/auth/domain';
import { NotFound } from './not-found';

const legacyRedirects: Route[] = [
  { path: 'pages/auth/login.html', redirectTo: 'login', pathMatch: 'full' },
  { path: 'pages/auth/register.html', redirectTo: 'register', pathMatch: 'full' },
  { path: 'pages/dashboard/index.html', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'pages/dashboard', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'pages/boards/index.html', redirectTo: 'boards', pathMatch: 'full' },
  { path: 'pages/boards', redirectTo: 'boards', pathMatch: 'full' },
  { path: 'pages/board/index.html', redirectTo: 'board', pathMatch: 'full' },
  { path: 'pages/board', redirectTo: 'board', pathMatch: 'full' },
  { path: 'pages/privacy/index.html', redirectTo: 'privacy', pathMatch: 'full' },
  { path: 'pages/imprint/index.html', redirectTo: 'imprint', pathMatch: 'full' },
];

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: landingRedirect },
  { path: 'login', loadChildren: () => import('@kanmind/auth/feature').then((m) => m.AUTH_ROUTES) },
  { path: 'register', loadChildren: () => import('@kanmind/auth/feature').then((m) => m.REGISTER_ROUTES) },
  { path: '', loadChildren: () => import('@kanmind/legal/feature').then((m) => m.LEGAL_ROUTES) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('@kanmind/dashboard/feature').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'boards',
    canActivate: [authGuard],
    loadChildren: () => import('@kanmind/boards/feature').then((m) => m.BOARDS_ROUTES),
  },
  {
    path: 'board',
    canActivate: [authGuard],
    loadChildren: () => import('@kanmind/boards/feature').then((m) => m.BOARD_ROUTES),
  },
  ...legacyRedirects,
  { path: '**', component: NotFound, title: 'Page not found | KanMind' },
];
