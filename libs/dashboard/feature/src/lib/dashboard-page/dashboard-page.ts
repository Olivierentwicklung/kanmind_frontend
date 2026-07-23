import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  DashboardOverviewView,
  DashboardStore,
  DashboardTaskMode,
  DashboardTaskSelection,
} from '@kanmind/dashboard/domain';
import { AuthStore } from '@kanmind/auth/domain';
import { DashboardOverview } from '../dashboard-overview/dashboard-overview';
import { TaskInsights } from '../task-insights/task-insights';

@Component({
  selector: 'lib-dashboard-page',
  imports: [DashboardOverview, RouterLink, TaskInsights],
  providers: [DashboardStore],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  readonly store = inject(DashboardStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly overview = computed<DashboardOverviewView>(() => ({
    fullName: this.store.context()?.fullName ?? '',
    assignedTaskCount: this.store.assignedTaskCount(),
    membershipCount: this.store.membershipCount(),
    urgentTaskCount: this.store.urgentTaskCount(),
    upcomingDeadline: this.store.upcomingDeadline(),
    completionPercentage: this.store.completionPercentage(),
    distribution: this.store.statusDistribution(),
    boards: this.store.boards(),
  }));

  ngOnInit(): void {
    const session = this.authStore.session();
    if (session) {
      this.store.loadDashboard({ userId: session.userId, fullName: session.fullName });
    }
  }

  selectTaskMode(mode: DashboardTaskMode): void {
    this.store.selectTaskMode(mode);
  }

  openBoard(boardId: number): void {
    void this.router.navigate(['/board'], { queryParams: { id: boardId } });
  }

  openTask(selection: DashboardTaskSelection): void {
    void this.router.navigate(['/board'], {
      queryParams: { id: selection.boardId, task_id: selection.taskId },
    });
  }

  openBoards(): void {
    void this.router.navigate(['/boards']);
  }
}
