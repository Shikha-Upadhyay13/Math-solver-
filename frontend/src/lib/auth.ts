const TOKEN_KEY = "mp_token";
const USER_KEY = "mp_user";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthBundle {
  user: AuthUser;
  token: AuthToken;
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return safeStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function getUser(): AuthUser | null {
  const raw = safeStorage()?.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(bundle: AuthBundle): void {
  const s = safeStorage();
  if (!s) return;
  s.setItem(TOKEN_KEY, bundle.token.access_token);
  s.setItem(USER_KEY, JSON.stringify(bundle.user));
}

export function clearAuth(): void {
  const s = safeStorage();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
}
