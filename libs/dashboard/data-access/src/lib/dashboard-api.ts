import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type DashboardTaskMode = 'assigned' | 'reviewing';

export interface DashboardBoardDto {
  id: number;
  title: string;
  owner_id: number;
}

export interface DashboardMemberDto {
  id: number;
  fullname: string;
}

export interface DashboardTaskDto {
  id: number;
  board: number;
  title: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'to-do' | 'in-progress' | 'review' | 'done';
  comments_count: number;
  assignee: DashboardMemberDto | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  getBoards(): Observable<readonly DashboardBoardDto[]> {
    return this.http.get<readonly DashboardBoardDto[]>('/api/boards/');
  }

  getTasks(mode: DashboardTaskMode): Observable<readonly DashboardTaskDto[]> {
    const path = mode === 'assigned' ? 'assigned-to-me' : 'reviewing';
    return this.http.get<readonly DashboardTaskDto[]>(`/api/tasks/${path}/`);
  }
}
