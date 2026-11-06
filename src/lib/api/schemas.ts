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

/** POST /images/presign response. URLs preserve request order. */
export const PresignImageUploadsResponseSchema = z.object({
  urls: z.array(
    z.object({
      key: z.string(),
      url: z.string(),
      expiresIn: z.number(),
    }),
  ),
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

// ---------- AI curation (see daily-zen-database/curator) ----------

/** A special day from the curator calendar, or a custom one the editor added. */
export const SpecialDaySchema = z
  .object({
    id: z.string(),
    name: z.string().default(''),
    start: z.string(),
    end: z.string(),
    weight: z.enum(['major', 'minor']).catch('minor'),
    occasions: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    tone: z.string().default(''),
    sensitive: z.boolean().default(false),
    region: z.string().default('global'),
    lead_days: z.number().default(0),
    default_on: z.boolean().default(true),
    source: z.string().default('rule'),
    note: z.string().default(''),
    chosen: z.boolean().optional(),
  })
  .passthrough();

export const SpecialDaysResponseSchema = z.object({
  monthKey: z.string(),
  items: z.array(SpecialDaySchema),
  brief: z.string().default(''),
});

export const CurateStartResponseSchema = z.object({
  jobId: z.string(),
  status: z.string(),
  monthKey: z.string(),
  scope: z.enum(['month', 'day']),
});

export const CurationJobSchema = z
  .object({
    jobId: z.string(),
    monthKey: z.string(),
    scope: z.enum(['month', 'day']).catch('month'),
    date: z.string().optional(),
    status: z.enum(['queued', 'running', 'done', 'failed']),
    stage: z.string().default(''),
    progress: z.number().default(0),
    error: z.string().optional(),
    failedStage: z.string().optional(),
    costUsd: z.number().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    hasRecoverableProposal: z.boolean().optional(),
  })
  .passthrough();

const ActiveJobSchema = z.object({ jobId: z.string(), startedAt: z.string() }).nullable().optional();

const DayIntentSchema = z
  .object({
    date: z.string(),
    focus: z.array(z.string()).default([]),
    tone: z.string().default(''),
    occasion: z.string().nullable().optional(),
    theme_topics: z.record(z.string(), z.array(z.string())).default({}),
    rationale: z.string().default(''),
  })
  .passthrough();

const ProposalSlotSchema = z
  .object({
    cardId: z.string(),
    theme: z.string(),
    rank: z.number().nullable().optional(),
    why: z.string().nullable().optional(),
    score: z.number().nullable().optional(),
    locked: z.boolean().optional(),
  })
  .passthrough();

const ProposalNoteSchema = z
  .object({
    date: z.string().optional(),
    theme: z.string().optional(),
    severity: z.string().default('low'),
    problem: z.string(),
    cardId: z.string().nullable().optional(),
    from: z.string().nullable().optional(),
    to: z.string().nullable().optional(),
  })
  .passthrough();

export const ProposalSchema = z
  .object({
    monthKey: z.string(),
    jobId: z.string().optional(),
    scope: z.enum(['month', 'day']).catch('month'),
    generatedAt: z.string().optional(),
    brief: z.string().optional().default(''),
    monthTheme: z.string().default(''),
    weeks: z.array(z.object({ week: z.number(), days: z.string(), arc: z.string() })).default([]),
    ids: z.record(z.string(), z.array(z.string())),
    days: z
      .record(
        z.string(),
        z
          .object({
            intent: DayIntentSchema.nullable().optional(),
            note: z.string().nullable().optional(),
            slots: z.array(ProposalSlotSchema).default([]),
          })
          .passthrough(),
      )
      .default({}),
    alternatives: z.record(z.string(), z.array(z.array(z.string()))).default({}),
    /** Cards the final review removed, kept across day regenerates; never offered back. */
    rejected: z.array(z.string()).default([]),
    critic: z.object({ summary: z.string().default('') }).passthrough().default({ summary: '' }),
    applied: z.array(ProposalNoteSchema).default([]),
    warnings: z.array(ProposalNoteSchema).default([]),
    stats: z.record(z.string(), z.unknown()).default({}),
    costUsd: z.number().default(0),
    totalCostUsd: z.number().optional(),
    specialDays: z.array(SpecialDaySchema).default([]),
  })
  .passthrough();

export const CurationResponseSchema = z.object({
  monthKey: z.string(),
  jobId: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  scope: z.string().nullable().optional(),
  brief: z.string().default(''),
  specialDays: z.array(SpecialDaySchema).default([]),
  activeJob: ActiveJobSchema,
  proposal: ProposalSchema,
});
