import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  DashboardApi,
  DashboardBoardDto,
  DashboardTaskDto,
  DashboardTaskMode,
} from './dashboard-api';

export interface DashboardBoardData {
  id: number;
  title: string;
  ownerId: number;
}
export interface DashboardTaskData {
  id: number;
  boardId: number;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'to-do' | 'in-progress' | 'review' | 'done';
  commentsCount: number;
  assignee: { id: number; fullName: string; initials: string } | null;
}
export interface DashboardRepositoryError {
  kind: 'network' | 'unexpected';
}

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
const toBoard = (dto: DashboardBoardDto): DashboardBoardData => ({
  id: dto.id,
  title: dto.title,
  ownerId: dto.owner_id,
});
const toTask = (dto: DashboardTaskDto): DashboardTaskData => ({
  id: dto.id,
  boardId: dto.board,
  title: dto.title,
  dueDate: dto.due_date,
  priority: dto.priority,
  status: dto.status,
  commentsCount: dto.comments_count,
  assignee: dto.assignee
    ? {
        id: dto.assignee.id,
        fullName: dto.assignee.fullname,
        initials: initials(dto.assignee.fullname),
      }
    : null,
});
export function toDashboardRepositoryError(
  error: unknown,
): DashboardRepositoryError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    (error.kind === 'network' || error.kind === 'unexpected')
  ) {
    return error as DashboardRepositoryError;
  }
  return error instanceof HttpErrorResponse && error.status === 0
    ? { kind: 'network' }
    : { kind: 'unexpected' };
}

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly api = inject(DashboardApi);
  getBoards(): Observable<readonly DashboardBoardData[]> {
    return this.api.getBoards().pipe(
      map((boards) => boards.map(toBoard)),
      catchError((error: unknown) =>
        throwError(() => toDashboardRepositoryError(error)),
      ),
    );
  }
  getTasks(mode: DashboardTaskMode): Observable<readonly DashboardTaskData[]> {
    return this.api.getTasks(mode).pipe(
      map((tasks) => tasks.map(toTask)),
      catchError((error: unknown) =>
        throwError(() => toDashboardRepositoryError(error)),
      ),
    );
  }
}
