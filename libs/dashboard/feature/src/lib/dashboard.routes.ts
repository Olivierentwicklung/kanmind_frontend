import { Route } from '@angular/router';
import { DashboardPage } from './dashboard-page/dashboard-page';

export const DASHBOARD_ROUTES: Route[] = [
  {
    path: '',
    component: DashboardPage,
    title: 'Dashboard | KanMind',
  },
];
