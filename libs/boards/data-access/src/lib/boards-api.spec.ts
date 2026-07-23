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
});
