import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardApi } from './dashboard-api';

describe('DashboardApi', () => {
  let api: DashboardApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DashboardApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads boards from the dashboard endpoint', () => {
    const boards = [{ id: 7, title: 'Migration Board', owner_id: 42 }];
    api.getBoards().subscribe((result) => expect(result).toEqual(boards));

    const request = http.expectOne('/api/boards/');
    expect(request.request.method).toBe('GET');
    request.flush(boards);
  });

  it.each([
    ['assigned', '/api/tasks/assigned-to-me/'],
    ['reviewing', '/api/tasks/reviewing/'],
  ] as const)('loads %s tasks', (mode, url) => {
    api.getTasks(mode).subscribe((result) => expect(result).toEqual([]));

    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
