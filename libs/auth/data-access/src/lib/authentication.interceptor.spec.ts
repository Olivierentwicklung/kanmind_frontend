import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authenticationInterceptor } from './authentication.interceptor';
import { SessionStorage } from './session-storage';

describe('authenticationInterceptor', () => {
  let http: HttpTestingController;
  let sessionStorage: Pick<SessionStorage, 'token'>;

  beforeEach(() => {
    sessionStorage = { token: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authenticationInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionStorage, useValue: sessionStorage },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('adds the authentication token when a session exists', () => {
    vi.mocked(sessionStorage.token).mockReturnValue('session-token');

    const client = TestBed.inject(HttpClient);
    client.get('/api/tasks/').subscribe();

    const request = http.expectOne('/api/tasks/');
    expect(request.request.headers.get('Authorization')).toBe(
      'Token session-token',
    );
    request.flush([]);
  });

  it('does not add an authorization header without a session', () => {
    vi.mocked(sessionStorage.token).mockReturnValue(null);

    const client = TestBed.inject(HttpClient);
    client.get('/api/tasks/').subscribe();

    const request = http.expectOne('/api/tasks/');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('preserves existing request headers when adding authentication', () => {
    vi.mocked(sessionStorage.token).mockReturnValue('session-token');

    const client = TestBed.inject(HttpClient);
    client
      .get('/api/tasks/', { headers: { 'X-Correlation-Id': 'request-42' } })
      .subscribe();

    const request = http.expectOne('/api/tasks/');
    expect(request.request.headers.get('X-Correlation-Id')).toBe('request-42');
    expect(request.request.headers.get('Authorization')).toBe(
      'Token session-token',
    );
    request.flush([]);
  });
});
