import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@kanmind/auth/domain';
import { BoardsStore } from '@kanmind/boards/domain';
import { BoardList } from '../board-list/board-list';
import { BoardSettingsDialog } from '../board-settings-dialog/board-settings-dialog';
import { CreateBoardDialog } from '../create-board-dialog/create-board-dialog';

@Component({
  selector: 'lib-boards-page',
  imports: [BoardList, BoardSettingsDialog, CreateBoardDialog, RouterLink],
  providers: [BoardsStore],
  templateUrl: './boards-page.html',
  styleUrl: './boards-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsPage implements OnInit {
  readonly store = inject(BoardsStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadBoards();
  }

  openBoard(boardId: number): void {
    void this.router.navigate(['/board'], { queryParams: { id: boardId } });
  }
}
