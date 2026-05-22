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
