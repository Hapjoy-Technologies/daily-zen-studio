import { ApiError } from './types';
import { MonthManifestSchema } from '@/lib/manifest/schemas';
import { pad2 } from '@/lib/manifest/build';
import type { MonthManifest } from '@/lib/manifest/types';

/**
 * Public CDN that serves the per-month manifests the iOS/Android apps consume.
 * Note: this is a *different* host than the editor API Lambda. No auth header.
 */
const MANIFEST_BASE = 'https://static.gratefulness.me/gratitude-daily-zen';

/** Daily Zen has been published since 2021 — probe from here forward when listing. */
export const EARLIEST_PROBED_MONTH: { year: number; month: number } = { year: 2021, month: 1 };

/** Build the CDN URL for a given (year, month). Month is zero-padded to 2 digits. */
export function manifestUrl(year: number, month: number): string {
  return `${MANIFEST_BASE}/${year}/${pad2(month)}/en_exp_2.json`;
}

/**
 * Fetch one month's manifest from the CDN.
 * Returns null for "manifest not published yet" (404 / 403) so callers can probe ranges
 * without treating absence as an error. Other failures throw.
 */
export async function fetchPastManifest(
  year: number,
  month: number,
  signal?: AbortSignal,
): Promise<MonthManifest | null> {
  const res = await fetch(manifestUrl(year, month), { signal, cache: 'force-cache' });
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to fetch manifest ${year}/${month}: ${res.status}`);
  }
  const json: unknown = await res.json();
  return MonthManifestSchema.parse(json);
}

/** All (year, month) candidates from EARLIEST_PROBED_MONTH up to one month past today. */
export function listCandidateMonths(now: Date = new Date()): Array<{ year: number; month: number }> {
  const out: Array<{ year: number; month: number }> = [];
  const startY = EARLIEST_PROBED_MONTH.year;
  const startM = EARLIEST_PROBED_MONTH.month;
  // Include one month past today so a freshly-published manifest is discoverable as soon as it lands.
  const endYearMonth = (now.getFullYear() * 12 + now.getMonth() + 1) + 1; // +1 month look-ahead
  for (let ym = startY * 12 + (startM - 1); ym <= endYearMonth; ym++) {
    out.push({ year: Math.floor(ym / 12), month: (ym % 12) + 1 });
  }
  return out;
}
