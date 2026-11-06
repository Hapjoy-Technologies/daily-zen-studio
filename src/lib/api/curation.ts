import { z } from 'zod';
import { apiRequest } from './client';
import { lookupCards } from './cards';
import {
  CurateStartResponseSchema,
  CurationJobSchema,
  CurationResponseSchema,
  ProposalSchema,
  SpecialDaySchema,
  SpecialDaysResponseSchema,
} from './schemas';
import { ApiError, type LibraryCard } from './types';
import type { MonthIdMap } from '@/lib/manifest/types';

export type SpecialDay = z.infer<typeof SpecialDaySchema>;
export type CurationJob = z.infer<typeof CurationJobSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type Curation = z.infer<typeof CurationResponseSchema>;

/** Settings the Studio may change; the curator clamps them to safe ranges. */
export type CurateSettings = {
  cooldownTextDays?: number;
  cooldownArticleDays?: number;
  seed?: number;
};

export type CurateRequest = {
  scope: 'month' | 'day';
  /** YYYY-MM-DD, day scope only. */
  date?: string;
  specialDays?: SpecialDay[];
  brief?: string;
  /** Slots to keep: YYYYMMDD_en → 6 cardIds, "" = open. */
  locked?: MonthIdMap;
  settings?: CurateSettings;
};

function monthPath(year: number, month: number): string {
  return `/months/${year}/${month}`;
}

/** GET /months/{y}/{m}/special-days — calendar defaults, ticked as last saved. */
export async function getSpecialDays(year: number, month: number) {
  const raw = await apiRequest<unknown>(`${monthPath(year, month)}/special-days`, { authForRead: true });
  return SpecialDaysResponseSchema.parse(raw);
}

/**
 * GET /months/{y}/{m}/curation — the latest saved proposal, or null when the
 * month has none yet. `activeJob` (also on the null case) is a job still running.
 */
export async function getCuration(
  year: number,
  month: number,
): Promise<{ curation: Curation | null; activeJob: { jobId: string; startedAt: string } | null }> {
  try {
    const raw = await apiRequest<unknown>(`${monthPath(year, month)}/curation`, { authForRead: true });
    const curation = CurationResponseSchema.parse(raw);
    return { curation, activeJob: curation.activeJob ?? null };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      const body = (e.body ?? {}) as { activeJob?: { jobId: string; startedAt: string } | null };
      return { curation: null, activeJob: body.activeJob ?? null };
    }
    throw e;
  }
}

/**
 * POST /months/{y}/{m}/curate — start a curation job (~3 min for a month,
 * ~15 s for a day). If one is already running for the month, returns that
 * job's id instead of starting another.
 */
export async function startCuration(
  year: number,
  month: number,
  req: CurateRequest,
): Promise<{ jobId: string; resumed: boolean }> {
  try {
    const raw = await apiRequest<unknown>(`${monthPath(year, month)}/curate`, { method: 'POST', body: req });
    return { jobId: CurateStartResponseSchema.parse(raw).jobId, resumed: false };
  } catch (e) {
    const body = e instanceof ApiError ? (e.body as { error?: string; jobId?: string } | null) : null;
    if (e instanceof ApiError && e.status === 409 && body?.error === 'curation-in-progress' && body.jobId) {
      return { jobId: body.jobId, resumed: true };
    }
    throw e;
  }
}

/** GET /jobs/{jobId} — status, stage and progress of a curation job. */
export async function getCurationJob(jobId: string): Promise<CurationJob> {
  const raw = await apiRequest<unknown>(`/jobs/${jobId}`, { authForRead: true });
  return CurationJobSchema.parse(raw);
}

/** /cards/lookup takes at most 500 ids; a proposal plus its alternatives is ~1,100. */
export async function lookupCardsChunked(ids: string[]): Promise<Map<string, LibraryCard>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 500) chunks.push(unique.slice(i, i + 500));
  const results = await Promise.all(chunks.map((c) => lookupCards(c)));
  const out = new Map<string, LibraryCard>();
  for (const r of results) for (const c of r.items) out.set(c.cardId, c);
  return out;
}
