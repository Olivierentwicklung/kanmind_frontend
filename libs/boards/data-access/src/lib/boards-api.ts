import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BoardSummaryDto {
  id: number;
  title: string;
  owner_id: number;
  member_count: number;
  ticket_count: number;
  tasks_to_do_count: number;
  tasks_high_prio_count: number;
}

export interface BoardMemberDto {
  id: number;
  email: string;
  fullname: string;
}

export interface BoardDetailDto extends BoardSummaryDto {
  members: readonly BoardMemberDto[];
  tasks?: readonly BoardTaskDto[];
}

export interface CreateBoardRequestDto {
  title: string;
  members: readonly number[];
}

export interface UpdateBoardRequestDto {
  title?: string;
  members?: readonly number[];
}

export type BoardTaskStatus = 'to-do' | 'in-progress' | 'review' | 'done';
export type BoardTaskPriority = 'low' | 'medium' | 'high';

export interface BoardTaskDto {
  id: number;
  board: number;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  due_date: string;
  comments_count: number;
  assignee: BoardMemberDto | null;
  reviewer: BoardMemberDto | null;
}

export interface SaveTaskRequestDto {
  board: number;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  assignee_id: number | null;
  reviewer_id: number | null;
  due_date: string;
}

export type UpdateTaskRequestDto =
  | Partial<SaveTaskRequestDto>
  | { status: BoardTaskStatus };

export interface TaskCommentDto {
  id: number;
  author: string;
  content: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class BoardsApi {
  private readonly http = inject(HttpClient);

  getBoards(): Observable<readonly BoardSummaryDto[]> {
    return this.http.get<readonly BoardSummaryDto[]>('/api/boards/');
  }

  getBoard(boardId: number): Observable<BoardDetailDto> {
    return this.http.get<BoardDetailDto>(`/api/boards/${boardId}/`);
  }

  findMember(email: string): Observable<BoardMemberDto> {
    const params = new HttpParams().set('email', email);
    return this.http.get<BoardMemberDto>('/api/email-check/', { params });
  }

  createBoard(command: CreateBoardRequestDto): Observable<BoardSummaryDto> {
    return this.http.post<BoardSummaryDto>('/api/boards/', command);
  }

  updateBoard(
    boardId: number,
    command: UpdateBoardRequestDto,
  ): Observable<BoardDetailDto> {
    return this.http.patch<BoardDetailDto>(`/api/boards/${boardId}/`, command);
  }

  deleteBoard(boardId: number): Observable<void> {
    return this.http.delete<void>(`/api/boards/${boardId}/`);
  }

  createTask(command: SaveTaskRequestDto): Observable<BoardTaskDto> {
    return this.http.post<BoardTaskDto>('/api/tasks/', command);
  }

  updateTask(
    taskId: number,
    command: UpdateTaskRequestDto,
  ): Observable<BoardTaskDto> {
    return this.http.patch<BoardTaskDto>(`/api/tasks/${taskId}/`, command);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${taskId}/`);
  }

  getTaskComments(taskId: number): Observable<readonly TaskCommentDto[]> {
    return this.http.get<readonly TaskCommentDto[]>(
      `/api/tasks/${taskId}/comments/`,
    );
  }

  createTaskComment(taskId: number, content: string): Observable<TaskCommentDto> {
    return this.http.post<TaskCommentDto>(`/api/tasks/${taskId}/comments/`, {
      content,
    });
  }

  deleteTaskComment(taskId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(
      `/api/tasks/${taskId}/comments/${commentId}/`,
    );
  }
}
