import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  DashboardLoadStatus,
  DashboardTask,
  DashboardTaskMode,
  DashboardTaskSelection,
} from '@kanmind/dashboard/domain';

@Component({
  selector: 'lib-task-insights',
  templateUrl: './task-insights.html',
  styleUrl: './task-insights.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInsights {
  readonly tasks = input<readonly DashboardTask[]>([]);
  readonly mode = input<DashboardTaskMode>('assigned');
  readonly status = input<DashboardLoadStatus>('success');
  readonly modeChanged = output<DashboardTaskMode>();
  readonly taskSelected = output<DashboardTaskSelection>();
}
