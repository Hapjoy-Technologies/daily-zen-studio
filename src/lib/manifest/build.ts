import type { LibraryCard } from '@/lib/api/types';
import { THEME_ORDER, THEME_TITLES, type ThemeName } from '@/lib/constants';
import type {
  ManifestEntry,
  MonthDraft,
  MonthIdMap,
  MonthManifest,
} from './types';

/** Convert a library card into the flattened manifest-entry shape the apps consume. */
export function libraryCardToManifestEntry(c: LibraryCard): ManifestEntry {
  return {
    theme: c.theme,
    themeTitle: c.themeTitle || THEME_TITLES[c.theme] || c.theme,
    type: c.type ?? '',
    dzType: c.dzType ?? '',
    language: 'en',
    text: c.text ?? '',
    author: c.author ?? '',
    articleUrl: c.articleUrl ?? '',
    uniqueId: c.cardId,
    bgImageUrl: c.latestBgImageUrl,
    dzImageUrl: c.latestDzImageUrl,
    primaryCTAText: c.primaryCTAText ?? '',
    sharePrefix: c.sharePrefix ?? '',
  };
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD → YYYYMMDD_en. */
export function manifestDateKey(isoDate: string): string {
  return `${isoDate.replaceAll('-', '')}_en`;
}

/** YYYYMMDD_en → YYYY-MM-DD. */
export function isoDateFromManifestKey(key: string): string {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}

/**
 * Convert a server-side IdMap → in-memory MonthDraft by resolving each ID via
 * `cardsById`. IDs that don't resolve are silently skipped (UI flags them
 * separately via the lookup `missing` set).
 */
export function idMapToMonthDraft(
  year: number,
  month: number,
  idMap: MonthIdMap,
  cardsById: ReadonlyMap<string, LibraryCard>,
): MonthDraft {
  const days: MonthDraft['days'] = {};
  for (const [dateKey, ids] of Object.entries(idMap)) {
    const iso = isoDateFromManifestKey(dateKey);
    const slots: Partial<Record<string, LibraryCard>> = {};
    for (let i = 0; i < THEME_ORDER.length && i < ids.length; i++) {
      const id = ids[i];
      const card = cardsById.get(id);
      if (card) slots[THEME_ORDER[i]] = card;
    }
    days[iso] = slots;
  }
  return {
    monthKey: `${year}-${pad2(month)}`,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert an in-memory MonthDraft → server-side IdMap.
 *
 * Each day's slot array is length-6 in fixed theme order; empty slots are
 * encoded as `""` so partial days can be saved as drafts. Days where ALL
 * six slots are empty are omitted entirely.
 *
 * The Lambda accepts empty strings in slots for save; Publish refuses if
 * any slot is empty (apps need a full day).
 */
export function monthDraftToIdMap(draft: MonthDraft): MonthIdMap {
  const out: MonthIdMap = {};
  for (const [iso, slots] of Object.entries(draft.days)) {
    const ids: string[] = [];
    let filled = 0;
    for (const theme of THEME_ORDER as readonly ThemeName[]) {
      const card = slots?.[theme];
      if (card) {
        ids.push(card.cardId);
        filled++;
      } else {
        ids.push('');
      }
    }
    if (filled > 0) {
      out[manifestDateKey(iso)] = ids;
    }
  }
  return out;
}

/**
 * Build the apps-facing manifest from an IdMap + a cardsById lookup.
 *
 * Empty-string slots are skipped silently — those are intentional
 * placeholders for unfilled slots in a partial-day draft, and the apps
 * gracefully render fewer than 6 entries when that happens.
 *
 * `missing` only contains slots that referenced a non-empty cardId that
 * couldn't be resolved (the card was deleted) — callers should block
 * Publish on that.
 *
 * Days that end up with zero resolved entries (all slots empty) are
 * omitted from the manifest entirely so the apps fall back to their
 * "no content for today" state.
 */
export function buildResolvedManifest(
  idMap: MonthIdMap,
  cardsById: ReadonlyMap<string, LibraryCard>,
): { manifest: MonthManifest; missing: Array<{ dateKey: string; slot: number; id: string }> } {
  const manifest: MonthManifest = {};
  const missing: Array<{ dateKey: string; slot: number; id: string }> = [];
  const sortedKeys = Object.keys(idMap).sort();
  for (const dateKey of sortedKeys) {
    const entries: ManifestEntry[] = [];
    const ids = idMap[dateKey];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!id) continue; // empty placeholder — skip silently
      const card = cardsById.get(id);
      if (!card) {
        missing.push({ dateKey, slot: i, id });
        continue;
      }
      entries.push(libraryCardToManifestEntry(card));
    }
    if (entries.length > 0) {
      manifest[dateKey] = entries;
    }
  }
  return { manifest, missing };
}

/** Build the full manifest for a month from the editor draft, in fixed theme order. */
export function buildManifest(draft: MonthDraft): MonthManifest {
  const out: MonthManifest = {};
  const sortedDates = Object.keys(draft.days).sort();
  for (const date of sortedDates) {
    const slots = draft.days[date] ?? {};
    const entries: ManifestEntry[] = [];
    for (const theme of THEME_ORDER as readonly ThemeName[]) {
      const card = slots[theme];
      if (!card) continue; // sanity check happens before export; here we just skip
      entries.push(libraryCardToManifestEntry(card));
    }
    if (entries.length > 0) {
      out[manifestDateKey(date)] = entries;
    }
  }
  return out;
}

export type ExportIssue =
  | { kind: 'empty'; date: string; theme: ThemeName }
  | { kind: 'duplicate'; uniqueId: string; text: string; dates: string[] };

/** Pre-export validation. Empty slots block export; duplicates need confirmation. */
export function validateDraft(draft: MonthDraft, monthDates: string[]): {
  empties: Extract<ExportIssue, { kind: 'empty' }>[];
  duplicates: Extract<ExportIssue, { kind: 'duplicate' }>[];
} {
  const empties: Extract<ExportIssue, { kind: 'empty' }>[] = [];
  const usage = new Map<string, { text: string; dates: string[] }>();

  for (const date of monthDates) {
    const slots = draft.days[date] ?? {};
    for (const theme of THEME_ORDER as readonly ThemeName[]) {
      const card = slots[theme];
      if (!card) {
        empties.push({ kind: 'empty', date, theme });
        continue;
      }
      const seen = usage.get(card.cardId);
      if (seen) {
        seen.dates.push(date);
      } else {
        usage.set(card.cardId, { text: card.text ?? '', dates: [date] });
      }
    }
  }

  const duplicates: Extract<ExportIssue, { kind: 'duplicate' }>[] = [];
  for (const [uniqueId, { text, dates }] of usage) {
    if (dates.length > 1) {
      duplicates.push({ kind: 'duplicate', uniqueId, text, dates });
    }
  }

  return { empties, duplicates };
}
