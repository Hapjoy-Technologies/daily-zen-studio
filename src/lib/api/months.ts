import { apiRequest } from './client';
import {
  MonthRowSchema,
  MonthsListResponseSchema,
} from '@/lib/manifest/schemas';
import type { MonthIdMap, MonthRow, MonthSummary } from '@/lib/manifest/types';

function monthPath(year: number, month: number): string {
  return `/months/${year}/${month}`;
}

/** GET /months — sidebar listing (lightweight, no draft/published maps). */
export async function listMonths(): Promise<MonthSummary[]> {
  const raw = await apiRequest<unknown>('/months', { authForRead: true });
  return MonthsListResponseSchema.parse(raw).items;
}

/** GET /months/{year}/{month} — full row including draft + published IdMaps. */
export async function getMonth(year: number, month: number): Promise<MonthRow> {
  const raw = await apiRequest<unknown>(monthPath(year, month), { authForRead: true });
  return MonthRowSchema.parse(raw);
}

/**
 * PUT /months/{year}/{month} — save the editor's draft IDs.
 *
 * `ifMatch` is the `draftVersion` the editor last loaded; when present, the
 * server returns 409 if another save raced in. Pass `null` to skip the
 * concurrency check (used for first-time saves on a brand-new month).
 *
 * `dzImageUrlStartIndex` (optional) is persisted on the row when set so
 * the next month's Figma import can auto-suggest the next start index.
 * Passing `null` clears the field.
 */
export async function saveMonthDraft(
  year: number,
  month: number,
  draft: MonthIdMap,
  ifMatch: number | null,
  dzImageUrlStartIndex?: number | null,
): Promise<MonthRow> {
  const body: {
    draft: MonthIdMap;
    ifMatch?: number;
    dzImageUrlStartIndex?: number | null;
  } = { draft };
  if (ifMatch !== null) body.ifMatch = ifMatch;
  if (dzImageUrlStartIndex !== undefined) {
    body.dzImageUrlStartIndex = dzImageUrlStartIndex;
  }
  const raw = await apiRequest<unknown>(monthPath(year, month), {
    method: 'PUT',
    body,
  });
  return MonthRowSchema.parse(raw);
}

/** POST /months/{year}/{month}/publish — flip draft → published. */
export async function publishMonth(year: number, month: number): Promise<MonthRow> {
  const raw = await apiRequest<unknown>(`${monthPath(year, month)}/publish`, {
    method: 'POST',
  });
  return MonthRowSchema.parse(raw);
}

/** DELETE /months/{year}/{month}/draft — revert draft back to published. */
export async function discardMonthDraft(
  year: number,
  month: number,
): Promise<MonthRow | null> {
  // 204 → row was wiped (no published version existed). 200 → reverted.
  const raw = await apiRequest<unknown>(`${monthPath(year, month)}/draft`, {
    method: 'DELETE',
  });
  if (raw === undefined) return null;
  return MonthRowSchema.parse(raw);
}
