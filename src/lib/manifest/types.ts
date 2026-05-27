import type { LibraryCard } from '@/lib/api/types';

/**
 * Manifest entry — one card slot in the per-day schedule the apps consume.
 * Field names differ from LibraryCard (cardId → uniqueId, latestBgImageUrl → bgImageUrl, etc.).
 */
export type ManifestEntry = {
  theme: string;
  themeTitle: string;
  type: string;
  dzType: string;
  language: 'en';
  text: string;
  author: string;
  articleUrl: string;
  uniqueId: string;
  bgImageUrl: string;
  dzImageUrl: string;
  primaryCTAText: string;
  sharePrefix: string;
};

/** Top-level keys look like "20260201_en"; values are the ordered list of 6 entries. */
export type MonthManifest = Record<string, ManifestEntry[]>;

/** Editor draft kept in localStorage while building a month. */
export type MonthDraft = {
  /** YYYY-MM */
  monthKey: string;
  /** date string YYYY-MM-DD → theme → LibraryCard (snapshot at assignment time) */
  days: Record<string, Partial<Record<string, LibraryCard>>>;
  updatedAt: string;
};

/**
 * Server-side per-month plan. Each `YYYYMMDD_en` key maps to an array of 6
 * cardIds in fixed theme order (see THEME_ORDER). Cards themselves are
 * resolved client-side via /cards/lookup.
 */
export type MonthIdMap = Record<string, string[]>;

/** Status chip shown in the sidebar; computed server-side from draft vs published. */
export type MonthStatus =
  | 'published'
  | 'draft-changes'
  | 'unpublished-draft'
  | 'not-built';

/** Lightweight row used by the sidebar — no draft/published maps. */
export type MonthSummary = {
  monthKey: string;
  year: number;
  month: number;
  draftUpdatedAt?: string | null;
  publishedAt?: string | null;
  draftVersion: number;
  publishVersion: number;
  /** Persisted when the month was imported from Figma. Drives the next month's auto-suggest. */
  dzImageUrlStartIndex?: number | null;
  status: MonthStatus;
};

/** Full row used by the editor. */
export type MonthRow = {
  monthKey: string;
  year: number;
  month: number;
  draft: MonthIdMap;
  draftVersion: number;
  draftUpdatedAt?: string | null;
  published?: MonthIdMap | null;
  publishVersion: number;
  publishedAt?: string | null;
  dzImageUrlStartIndex?: number | null;
  status: MonthStatus;
};
