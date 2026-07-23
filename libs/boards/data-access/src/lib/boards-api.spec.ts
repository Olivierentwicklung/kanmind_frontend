import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BoardsApi } from './boards-api';

describe('BoardsApi', () => {
  let api: BoardsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardsApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BoardsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads board summaries and a board detail', () => {
    api.getBoards().subscribe();
    expect(http.expectOne('/api/boards/').request.method).toBe('GET');

    api.getBoard(7).subscribe();
    expect(http.expectOne('/api/boards/7/').request.method).toBe('GET');
  });

  it('looks up a member by encoded email', () => {
    api.findMember('grace+boards@example.com').subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/email-check/' &&
        candidate.params.get('email') === 'grace+boards@example.com',
    );
    expect(request.request.method).toBe('GET');
  });

  it('creates, updates and deletes boards with the expected payloads', () => {
    api.createBoard({ title: 'Angular Migration', members: [43] }).subscribe();
    const create = http.expectOne('/api/boards/');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ title: 'Angular Migration', members: [43] });

    api.updateBoard(7, { title: 'Renamed Board' }).subscribe();
    const update = http.expectOne('/api/boards/7/');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ title: 'Renamed Board' });

    api.deleteBoard(7).subscribe();
    expect(http.expectOne('/api/boards/7/').request.method).toBe('DELETE');
  });

  it('creates, updates and deletes tasks with the expected payloads', () => {
    const task = {
      board: 7,
      title: 'Angular parity',
      description: 'Protect the migration',
      status: 'review' as const,
      priority: 'high' as const,
      assignee_id: null,
      reviewer_id: 43,
      due_date: '2099-09-30',
    };

    api.createTask(task).subscribe();
    const create = http.expectOne('/api/tasks/');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(task);

    api.updateTask(21, { status: 'done' }).subscribe();
    const update = http.expectOne('/api/tasks/21/');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ status: 'done' });

    api.deleteTask(21).subscribe();
    expect(http.expectOne('/api/tasks/21/').request.method).toBe('DELETE');
  });

  it('loads, creates and deletes task comments', () => {
    api.getTaskComments(21).subscribe();
    expect(http.expectOne('/api/tasks/21/comments/').request.method).toBe('GET');

    api.createTaskComment(21, 'Migration note').subscribe();
    const create = http.expectOne('/api/tasks/21/comments/');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ content: 'Migration note' });

    api.deleteTaskComment(21, 31).subscribe();
    expect(http.expectOne('/api/tasks/21/comments/31/').request.method).toBe('DELETE');
  });
});
