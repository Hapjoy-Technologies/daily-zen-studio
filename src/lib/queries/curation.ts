import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCuration,
  getCurationJob,
  getSpecialDays,
  lookupCardsChunked,
  startCuration,
  type CurateRequest,
  type CurationJob,
} from '@/lib/api/curation';
import { queryKeys } from './keys';

/** Special days for the month's brief step (calendar defaults + the last saved selection). */
export function useSpecialDays(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.specialDays(year, month),
    queryFn: () => getSpecialDays(year, month),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** The month's latest saved AI proposal (null when there is none yet). */
export function useCuration(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.curation(year, month),
    queryFn: () => getCuration(year, month),
    enabled,
    staleTime: 30_000,
  });
}

const POLL_MS = 2_000;

/** Polls a curation job every 2 s until it finishes. */
export function useCurationJob(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.curationJob(jobId ?? ''),
    queryFn: () => getCurationJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (q) => {
      const job = q.state.data as CurationJob | undefined;
      return job && (job.status === 'done' || job.status === 'failed') ? false : POLL_MS;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
}

export function useStartCuration(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CurateRequest) => startCuration(year, month, req),
    onSuccess: () => {
      // The brief and special days are saved with the job; refresh them next time.
      qc.invalidateQueries({ queryKey: queryKeys.specialDays(year, month) });
    },
  });
}

/** Resolve every card a proposal references (picks + alternatives) in ≤500-id chunks. */
export function useCurationCards(ids: readonly string[], enabled = true) {
  return useQuery({
    queryKey: queryKeys.curationCards(ids),
    queryFn: () => lookupCardsChunked([...ids]),
    enabled: enabled && ids.length > 0,
    staleTime: 5 * 60_000,
    // After a day regenerate most cards are unchanged; keep showing them while the new set loads.
    placeholderData: keepPreviousData,
  });
}
