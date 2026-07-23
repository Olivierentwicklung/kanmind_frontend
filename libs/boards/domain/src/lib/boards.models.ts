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
}
