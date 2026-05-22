import { DRAFT_KEY_PREFIX } from '@/lib/constants';
import type { MonthDraft } from './types';

function key(year: number, month: number): string {
  return `${DRAFT_KEY_PREFIX}${year}_${month}`;
}

export function loadDraft(year: number, month: number): MonthDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key(year, month));
    if (!raw) return null;
    return JSON.parse(raw) as MonthDraft;
  } catch {
    return null;
  }
}

export function saveDraft(year: number, month: number, draft: MonthDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(year, month), JSON.stringify(draft));
  } catch {
    // localStorage quota or disabled — silently ignore; export still works in-memory.
  }
}

export function deleteDraft(year: number, month: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key(year, month));
}

export function listDraftMonths(): string[] {
  if (typeof window === 'undefined') return [];
  const out: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(DRAFT_KEY_PREFIX)) out.push(k.slice(DRAFT_KEY_PREFIX.length));
  }
  return out;
}
