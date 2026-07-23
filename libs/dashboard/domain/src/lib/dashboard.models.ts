export type DashboardLoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type DashboardTaskMode = 'assigned' | 'reviewing';

export interface DashboardContext {
  userId: number;
  fullName: string;
}

export interface DashboardError {
  kind: 'network' | 'unexpected';
}

export interface DashboardBoard {
  id: number;
  title: string;
  ownerId: number;
}

export interface DashboardAssignee {
  id: number;
  fullName: string;
  initials: string;
}

export interface DashboardTask {
  id: number;
  boardId: number;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'to-do' | 'in-progress' | 'review' | 'done';
  commentsCount: number;
  assignee: DashboardAssignee | null;
}

export interface TaskStatusCount {
  label: 'To-do' | 'In progress' | 'Review' | 'Done';
  count: number;
}

export interface DashboardOverviewView {
  fullName: string;
  assignedTaskCount: number;
  membershipCount: number;
  urgentTaskCount: number;
  upcomingDeadline: string;
  completionPercentage: number;
  distribution: readonly TaskStatusCount[];
  boards: readonly DashboardBoard[];
}

export interface DashboardTaskSelection {
  boardId: number;
  taskId: number;
}
