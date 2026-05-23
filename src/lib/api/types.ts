/**
 * Mirrors the DynamoDB row shape returned by the Lambda
 * (see daily-zen-database/lambda/handler.py).
 *
 * Library cards are the unique-card store; one row per unique card.
 * Manifest entries (see lib/manifest/types.ts) are a flattened per-date snapshot.
 */
export type LibraryCard = {
  cardId: string;
  theme: string;
  themeTitle: string;
  type?: string;
  dzType?: string;
  status?: string; // "active" | "retired"
  text?: string;
  author?: string;
  articleUrl?: string | null;
  latestBgImageUrl: string;
  latestDzImageUrl: string;
  primaryCTAText?: string;
  sharePrefix?: string;
  firstUsedOn?: string;
  lastUsedOn?: string;
  usageCount?: number;
  usageHistory?: string[];
};

export type CardsPage = {
  items: LibraryCard[];
  cursor: string | null;
  count: number;
};

export type ThemeStat = { theme: string; count: number };
export type AuthorStat = { author: string; count: number };
export type Stats = {
  total: number;
  byTheme: Record<string, number>;
  byStatus: Record<string, number>;
};

/** Server-side sort key on /cards. lru = oldest-used first, mru = newest-used first. */
export type SortKey = 'lru' | 'mru' | 'most' | 'alpha';

export type ListCardsParams = {
  theme?: string;
  author?: string;
  status?: string;
  sort?: SortKey;
  limit?: number;
  cursor?: string | null;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
