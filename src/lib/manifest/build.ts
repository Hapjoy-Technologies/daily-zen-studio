import type { LibraryCard } from '@/lib/api/types';
import { THEME_ORDER, THEME_TITLES, type ThemeName } from '@/lib/constants';
import type { ManifestEntry, MonthDraft, MonthManifest } from './types';

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
