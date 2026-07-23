import { Routes } from '@angular/router';
import { BoardsPage } from './boards-page/boards-page';
import { BoardPage } from './board-page/board-page';

export const BOARDS_ROUTES: Routes = [
  {
    path: '',
    component: BoardsPage,
    title: 'Boards | KanMind',
  },
];

export const BOARD_ROUTES: Routes = [
  {
    path: '',
    component: BoardPage,
    title: 'Board | KanMind',
  },
];
