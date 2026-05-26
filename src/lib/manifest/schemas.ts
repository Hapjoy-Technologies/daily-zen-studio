import { z } from 'zod';

export const ManifestEntrySchema = z.object({
  theme: z.string(),
  themeTitle: z.string(),
  type: z.string().default(''),
  dzType: z.string().default(''),
  language: z.literal('en'),
  text: z.string().default(''),
  author: z.string().default(''),
  articleUrl: z.string().default(''),
  uniqueId: z.string(),
  bgImageUrl: z.string().default(''),
  dzImageUrl: z.string().default(''),
  primaryCTAText: z.string().default(''),
  sharePrefix: z.string().default(''),
});

export const MonthManifestSchema = z.record(z.string(), z.array(ManifestEntrySchema));

/** YYYYMMDD_en → array of exactly 6 cardIds, in fixed theme order. */
export const MonthIdMapSchema = z.record(
  z.string().regex(/^\d{8}_en$/, 'expected YYYYMMDD_en'),
  z.array(z.string()).length(6),
);

const MonthStatusSchema = z.enum([
  'published',
  'draft-changes',
  'unpublished-draft',
  'not-built',
]);

export const MonthSummarySchema = z.object({
  monthKey: z.string(),
  year: z.number(),
  month: z.number(),
  draftUpdatedAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  draftVersion: z.number().default(0),
  publishVersion: z.number().default(0),
  status: MonthStatusSchema,
});

export const MonthRowSchema = z.object({
  monthKey: z.string(),
  year: z.number(),
  month: z.number(),
  draft: MonthIdMapSchema.default({}),
  draftVersion: z.number().default(0),
  draftUpdatedAt: z.string().nullable().optional(),
  published: MonthIdMapSchema.nullable().optional(),
  publishVersion: z.number().default(0),
  publishedAt: z.string().nullable().optional(),
  status: MonthStatusSchema,
});

export const MonthsListResponseSchema = z.object({
  items: z.array(MonthSummarySchema),
});
