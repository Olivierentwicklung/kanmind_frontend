import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api-base-url';
import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  it('posts the login wire contract to the configured API', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api/' }] });
    const http = TestBed.inject(HttpTestingController);
    const command = { email: 'user@example.com', password: 'secret' };
    let response: unknown;
    TestBed.inject(AuthApi).login(command).subscribe((value) => response = value);

    const request = http.expectOne('/api/login/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(command);
    const dto = { token: 'token', user_id: 7, email: command.email, fullname: 'User Name' };
    request.flush(dto);
    expect(response).toEqual(dto);
    http.verify();
  });

  it('posts the registration wire contract to the configured API', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api/' }] });
    const http = TestBed.inject(HttpTestingController);
    const command = {
      fullname: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'long-enough',
      repeated_password: 'long-enough',
    };

    TestBed.inject(AuthApi).register(command).subscribe();

    const request = http.expectOne('/api/registration/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(command);
    request.flush({ token: 'token', user_id: 7, email: command.email, fullname: command.fullname });
    http.verify();
  });
});
