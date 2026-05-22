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
