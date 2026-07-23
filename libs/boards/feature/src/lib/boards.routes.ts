import { Routes } from '@angular/router';
import { BoardsPage } from './boards-page/boards-page';

export const BOARDS_ROUTES: Routes = [
  {
    path: '',
    component: BoardsPage,
    title: 'Boards | KanMind',
  },
];
