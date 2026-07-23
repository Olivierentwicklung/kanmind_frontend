import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  BoardDetailDto,
  BoardMemberDto,
  BoardSummaryDto,
  BoardTaskDto,
  BoardsApi,
  BoardTaskPriority,
  BoardTaskStatus,
  CreateBoardRequestDto,
  SaveTaskRequestDto,
  TaskCommentDto,
  UpdateBoardRequestDto,
  UpdateTaskRequestDto,
} from './boards-api';

export type BoardsRepositoryError =
  | { kind: 'network' }
  | { kind: 'not-found' }
  | { kind: 'validation' }
  | { kind: 'unexpected' };

export interface BoardSummaryData {
  id: number;
  title: string;
  ownerId: number;
  memberCount: number;
  ticketCount: number;
  tasksToDoCount: number;
  highPriorityTaskCount: number;
}
export interface BoardMemberData {
  id: number;
  email: string;
  fullName: string;
}
export interface BoardTaskData {
  id: number;
  boardId: number;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  dueDate: string;
  commentsCount: number;
  assignee: BoardMemberData | null;
  reviewer: BoardMemberData | null;
}
export interface BoardDetailData extends BoardSummaryData {
  members: readonly BoardMemberData[];
  tasks: readonly BoardTaskData[];
}
export interface TaskCommentData {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface SaveBoardTaskData {
  boardId: number;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  assigneeId: number | null;
  reviewerId: number | null;
  dueDate: string;
}

export type UpdateBoardTaskData =
  | Partial<SaveBoardTaskData>
  | { status: BoardTaskStatus };

const toMember = (dto: BoardMemberDto): BoardMemberData => ({
  id: dto.id,
  email: dto.email,
  fullName: dto.fullname,
});
const toSummary = (dto: BoardSummaryDto): BoardSummaryData => ({
  id: dto.id,
  title: dto.title,
  ownerId: dto.owner_id,
  memberCount: dto.member_count,
  ticketCount: dto.ticket_count,
  tasksToDoCount: dto.tasks_to_do_count,
  highPriorityTaskCount: dto.tasks_high_prio_count,
});
const toTask = (dto: BoardTaskDto): BoardTaskData => ({
  id: dto.id,
  boardId: dto.board,
  title: dto.title,
  description: dto.description,
  status: dto.status,
  priority: dto.priority,
  dueDate: dto.due_date,
  commentsCount: dto.comments_count,
  assignee: dto.assignee ? toMember(dto.assignee) : null,
  reviewer: dto.reviewer ? toMember(dto.reviewer) : null,
});
const toBoard = (dto: BoardDetailDto): BoardDetailData => ({
  ...toSummary(dto),
  members: dto.members.map(toMember),
  tasks: (dto.tasks ?? []).map(toTask),
});
const toComment = (dto: TaskCommentDto): TaskCommentData => ({
  id: dto.id,
  author: dto.author,
  content: dto.content,
  createdAt: dto.created_at,
});
const toSaveTaskRequest = (command: SaveBoardTaskData): SaveTaskRequestDto => ({
  board: command.boardId,
  title: command.title,
  description: command.description,
  status: command.status,
  priority: command.priority,
  assignee_id: command.assigneeId,
  reviewer_id: command.reviewerId,
  due_date: command.dueDate,
});
const toUpdateTaskRequest = (
  command: UpdateBoardTaskData,
): UpdateTaskRequestDto => {
  const request: Partial<SaveTaskRequestDto> = {};
  if ('boardId' in command) request.board = command.boardId;
  if ('title' in command) request.title = command.title;
  if ('description' in command) request.description = command.description;
  if ('status' in command) request.status = command.status;
  if ('priority' in command) request.priority = command.priority;
  if ('assigneeId' in command) request.assignee_id = command.assigneeId;
  if ('reviewerId' in command) request.reviewer_id = command.reviewerId;
  if ('dueDate' in command) request.due_date = command.dueDate;
  return request;
};

export function toBoardsRepositoryError(error: unknown): BoardsRepositoryError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return { kind: 'network' };
    if (error.status === 404) return { kind: 'not-found' };
    if (error.status === 400) return { kind: 'validation' };
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    ['network', 'not-found', 'validation', 'unexpected'].includes(
      String(error.kind),
    )
  )
    return error as BoardsRepositoryError;
  return { kind: 'unexpected' };
}

@Injectable({ providedIn: 'root' })
export class BoardsRepository {
  private readonly api = inject(BoardsApi);
  private mapped<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((error: unknown) =>
        throwError(() => toBoardsRepositoryError(error)),
      ),
    );
  }
  getBoards(): Observable<readonly BoardSummaryData[]> {
    return this.mapped(this.api.getBoards()).pipe(
      map((items) => items.map(toSummary)),
    );
  }
  getBoard(id: number): Observable<BoardDetailData> {
    return this.mapped(this.api.getBoard(id)).pipe(map(toBoard));
  }
  findMember(email: string): Observable<BoardMemberData> {
    return this.mapped(this.api.findMember(email)).pipe(map(toMember));
  }
  createBoard(command: CreateBoardRequestDto): Observable<BoardSummaryData> {
    return this.mapped(this.api.createBoard(command)).pipe(map(toSummary));
  }
  updateBoard(
    id: number,
    command: UpdateBoardRequestDto,
  ): Observable<BoardDetailData> {
    return this.mapped(this.api.updateBoard(id, command)).pipe(map(toBoard));
  }
  deleteBoard(id: number): Observable<void> {
    return this.mapped(this.api.deleteBoard(id));
  }
  createTask(command: SaveBoardTaskData): Observable<BoardTaskData> {
    return this.mapped(this.api.createTask(toSaveTaskRequest(command))).pipe(
      map(toTask),
    );
  }
  updateTask(
    id: number,
    command: UpdateBoardTaskData,
  ): Observable<BoardTaskData> {
    return this.mapped(
      this.api.updateTask(id, toUpdateTaskRequest(command)),
    ).pipe(map(toTask));
  }
  deleteTask(id: number): Observable<void> {
    return this.mapped(this.api.deleteTask(id));
  }
  getTaskComments(id: number): Observable<readonly TaskCommentData[]> {
    return this.mapped(this.api.getTaskComments(id)).pipe(
      map((items) => items.map(toComment)),
    );
  }
  createTaskComment(id: number, content: string): Observable<TaskCommentData> {
    return this.mapped(this.api.createTaskComment(id, content)).pipe(
      map(toComment),
    );
  }
  deleteTaskComment(taskId: number, commentId: number): Observable<void> {
    return this.mapped(this.api.deleteTaskComment(taskId, commentId));
  }
}
