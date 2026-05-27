import { z } from 'zod';

/**
 * Zod schema for the library card returned by the Lambda.
 * Permissive on optional/empty fields — DynamoDB sometimes omits attrs.
 */
export const LibraryCardSchema = z.object({
  cardId: z.string(),
  theme: z.string(),
  themeTitle: z.string().default(''),
  type: z.string().optional().default(''),
  dzType: z.string().optional().default(''),
  status: z.string().optional().default('active'),
  text: z.string().optional().default(''),
  author: z.string().optional().default(''),
  articleUrl: z.string().nullable().optional().default(''),
  latestBgImageUrl: z.string().default(''),
  latestDzImageUrl: z.string().default(''),
  primaryCTAText: z.string().optional().default(''),
  sharePrefix: z.string().optional().default(''),
  firstUsedOn: z.string().optional().default(''),
  lastUsedOn: z.string().optional().default(''),
  usageCount: z.number().optional().default(0),
  usageHistory: z.array(z.string()).optional().default([]),
});

export const CardsPageSchema = z.object({
  items: z.array(LibraryCardSchema),
  cursor: z.string().nullable(),
  count: z.number(),
});

export const ThemesResponseSchema = z.object({
  themes: z.array(z.object({ theme: z.string(), count: z.number() })),
});

export const AuthorsResponseSchema = z.object({
  authors: z.array(z.object({ author: z.string(), count: z.number() })),
});

export const StatsResponseSchema = z.object({
  total: z.number(),
  byTheme: z.record(z.string(), z.number()),
  byStatus: z.record(z.string(), z.number()),
});

export const BulkUpdateResponseSchema = z.object({
  updated: z.array(z.string()),
  missing: z.array(z.string()),
});

export const CardsLookupResponseSchema = z.object({
  items: z.array(LibraryCardSchema),
  missing: z.array(z.string()),
});

/** POST /cards/match response — results preserve request order. */
export const CardsMatchResponseSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      // Full library card for the match (or null if none). Lets the import
      // dialog render a preview and build a PATCH without a second fetch.
      match: LibraryCardSchema.nullable(),
    }),
  ),
});
