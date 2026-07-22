import { TestBed } from '@angular/core/testing';
import { AUTH_STORAGE_KEYS, SessionStorage } from './session-storage';

describe('SessionStorage', () => {
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); });

  it('persists and hydrates every legacy key', () => {
    const service = TestBed.inject(SessionStorage);
    const session = { token: 'abc', userId: 42, email: 'a@b.test', fullName: 'A B' };
    service.write(session);
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.token)).toBe('abc');
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.userId)).toBe('42');
    expect(service.read()).toEqual(session);
  });

  it('clears a malformed partial session', () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.token, 'abc');
    expect(TestBed.inject(SessionStorage).read()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('clears all authentication keys', () => {
    const service = TestBed.inject(SessionStorage);
    service.write({ token: 'abc', userId: 1, email: 'a@b.test', fullName: 'A B' });
    service.clear();
    expect(service.read()).toBeNull();
  });
});
