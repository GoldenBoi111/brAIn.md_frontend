/** Cookie name — replace with Supabase session cookie when wiring real auth. */
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

  // Stub token for middleware — swap for Supabase `setSession` cookie later.
  document.cookie = `${AUTH_COOKIE_NAME}=stub-supabase-token; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
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
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/** Stub for middleware — returns true when the auth cookie is present. */
export function isAuthenticatedRequest(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue);
}
