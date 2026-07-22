import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  { path: 'privacy', loadComponent: () => import('./privacy-page').then((m) => m.PrivacyPage), title: 'Privacy Policy | KanMind' },
  { path: 'imprint', loadComponent: () => import('./imprint-page').then((m) => m.ImprintPage), title: 'Imprint | KanMind' },
];
