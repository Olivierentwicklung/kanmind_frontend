import { Route } from '@angular/router';
import { authGuard, landingGuard } from '@kanmind/auth/domain';
import { MigrationPlaceholder } from './migration-placeholder';
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
  { path: '', pathMatch: 'full', canActivate: [landingGuard], component: MigrationPlaceholder },
  { path: 'login', loadChildren: () => import('@kanmind/auth/feature').then((m) => m.AUTH_ROUTES) },
  { path: 'register', loadChildren: () => import('@kanmind/auth/feature').then((m) => m.REGISTER_ROUTES) },
  { path: '', loadChildren: () => import('@kanmind/legal/feature').then((m) => m.LEGAL_ROUTES) },
  { path: 'dashboard', component: MigrationPlaceholder, canActivate: [authGuard], data: { title: 'Dashboard migration' } },
  { path: 'boards', component: MigrationPlaceholder, canActivate: [authGuard], data: { title: 'Boards migration' } },
  { path: 'board', component: MigrationPlaceholder, canActivate: [authGuard], data: { title: 'Board migration' } },
  ...legacyRedirects,
  { path: '**', component: NotFound, title: 'Page not found | KanMind' },
];
