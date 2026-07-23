export type BoardsLoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type BoardsMutationStatus = 'idle' | 'loading' | 'error';
export type BoardsDialog = 'closed' | 'create' | 'settings';

export type BoardsError =
  | { kind: 'network' }
  | { kind: 'not-found' }
  | { kind: 'validation' }
  | { kind: 'unexpected' };

export type BoardMemberError =
  | 'duplicate'
  | 'not-found'
  | 'network'
  | 'unexpected';

export interface BoardSummary {
  id: number;
  title: string;
  ownerId: number;
  memberCount: number;
  ticketCount: number;
  tasksToDoCount: number;
  highPriorityTaskCount: number;
}

export interface BoardMember {
  id: number;
  email: string;
  fullName: string;
}

export interface BoardDetail extends BoardSummary {
  members: readonly BoardMember[];
  tasks: readonly BoardTask[];
}

export type BoardTaskStatus = 'to-do' | 'in-progress' | 'review' | 'done';
export type BoardTaskPriority = 'low' | 'medium' | 'high';

export interface BoardTask {
  id: number;
  boardId: number;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  dueDate: string;
  commentsCount: number;
  assignee: BoardMember | null;
  reviewer: BoardMember | null;
}

export interface SaveBoardTaskCommand {
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  dueDate: string;
  assigneeId: number | null;
  reviewerId: number | null;
}

export interface TaskComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}
