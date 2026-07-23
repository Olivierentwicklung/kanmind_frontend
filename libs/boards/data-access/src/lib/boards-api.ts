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
}

export interface CreateBoardRequestDto {
  title: string;
  members: readonly number[];
}

export interface UpdateBoardRequestDto {
  title?: string;
  members?: readonly number[];
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
}
