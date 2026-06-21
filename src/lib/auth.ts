/** Session cookie set by the backend on login/register. */
export const SESSION_COOKIE_NAME = "brain_session";

/** Legacy stub cookie — still cleared on sign-out during transition. */
export const AUTH_COOKIE_NAME = "brain-md-auth";

const AUTH_STORAGE_KEY = "brain-md-auth";

export interface AuthSession {
  email: string;
  signedInAt: string;
}

export function setAuthenticated(email: string): void {
  if (typeof window === "undefined") return;

  const session: AuthSession = {
    email,
    signedInAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthenticatedSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthenticatedSession(): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthenticatedRequest(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue);
}
