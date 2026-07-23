import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BoardSummary } from '@kanmind/boards/domain';

@Component({
  selector: 'lib-board-list',
  templateUrl: './board-list.html',
  styleUrl: './board-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardList {
  readonly boards = input.required<readonly BoardSummary[]>();
  readonly boardSelected = output<number>();
  readonly settingsRequested = output<number>();
}
