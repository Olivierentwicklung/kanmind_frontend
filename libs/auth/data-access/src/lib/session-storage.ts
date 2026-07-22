import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

export interface StoredAuthSession {
  token: string;
  userId: number;
  email: string;
  fullName: string;
}

export const AUTH_STORAGE_KEYS = {
  token: 'auth-token',
  userId: 'auth-user-id',
  email: 'auth-email',
  fullName: 'auth-fullname',
} as const;

@Injectable({ providedIn: 'root' })
export class SessionStorage {
  private readonly document = inject(DOCUMENT);

  read(): StoredAuthSession | null {
    const storage = this.storage;
    if (!storage) return null;

    const token = storage.getItem(AUTH_STORAGE_KEYS.token);
    const userIdValue = storage.getItem(AUTH_STORAGE_KEYS.userId);
    const email = storage.getItem(AUTH_STORAGE_KEYS.email);
    const fullName = storage.getItem(AUTH_STORAGE_KEYS.fullName);
    const userId = Number(userIdValue);

    if (!token || !userIdValue || !Number.isInteger(userId) || !email || !fullName) {
      this.clear();
      return null;
    }

    return { token, userId, email, fullName };
  }

  write(session: StoredAuthSession): void {
    const storage = this.storage;
    if (!storage) return;
    storage.setItem(AUTH_STORAGE_KEYS.token, session.token);
    storage.setItem(AUTH_STORAGE_KEYS.userId, String(session.userId));
    storage.setItem(AUTH_STORAGE_KEYS.email, session.email);
    storage.setItem(AUTH_STORAGE_KEYS.fullName, session.fullName);
  }

  clear(): void {
    const storage = this.storage;
    if (!storage) return;
    Object.values(AUTH_STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  }

  token(): string | null {
    return this.storage?.getItem(AUTH_STORAGE_KEYS.token) ?? null;
  }

  private get storage(): Storage | null {
    return this.document.defaultView?.localStorage ?? null;
  }
}
