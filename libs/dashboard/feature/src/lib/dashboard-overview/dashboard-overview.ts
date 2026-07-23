import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DashboardOverviewView } from '@kanmind/dashboard/domain';

@Component({
  selector: 'lib-dashboard-overview',
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOverview {
  readonly view = input.required<DashboardOverviewView>();
  readonly boardSelected = output<number>();
  readonly boardsRequested = output<void>();
}
