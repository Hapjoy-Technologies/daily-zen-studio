import { SESSION_PASSWORD_KEY } from '@/lib/constants';

export function getEditorPassword(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(SESSION_PASSWORD_KEY);
  } catch {
    return null;
  }
}

export function setEditorPassword(password: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
}

export function clearEditorPassword(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SESSION_PASSWORD_KEY);
}
