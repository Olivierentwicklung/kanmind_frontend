export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  userId: number;
  email: string;
  fullName: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';
export type AuthError = 'invalidCredentials' | 'network' | 'unexpected';

export const GUEST_LOGIN: LoginCommand = {
  email: 'kevin@kovacsi.de',
  password: 'asdasdasd',
};
