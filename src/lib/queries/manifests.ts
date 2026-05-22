import * as React from 'react';
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchPastManifest, listCandidateMonths } from '@/lib/api/manifests';
import type { MonthManifest } from '@/lib/manifest/types';

const STALE_FOREVER = 24 * 60 * 60_000; // 1 day — published manifests don't change.

function manifestKey(year: number, month: number) {
  return ['past-manifest', year, month] as const;
}

export function usePastManifest(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: manifestKey(year, month),
    queryFn: ({ signal }) => fetchPastManifest(year, month, signal),
    staleTime: STALE_FOREVER,
    gcTime: STALE_FOREVER,
    retry: 0,
    enabled,
  });
}

export type AvailableMonth = {
  year: number;
  month: number;
  key: string; // `${year}_${month}`
  manifest: MonthManifest;
};

/**
 * Probes the CDN in parallel from EARLIEST_PROBED_MONTH to one month after today.
 * Returns the available months (only those whose probe returned a manifest) plus
 * a single "isLoading" flag covering the in-flight probes.
 */
export function useAvailableManifests(): {
  available: AvailableMonth[];
  isLoading: boolean;
  errors: Error[];
} {
  const candidates = React.useMemo(() => listCandidateMonths(), []);

  const results = useQueries({
    queries: candidates.map((c) => ({
      queryKey: manifestKey(c.year, c.month),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        fetchPastManifest(c.year, c.month, signal),
      staleTime: STALE_FOREVER,
      gcTime: STALE_FOREVER,
      retry: 0,
    })),
  });

  return React.useMemo(() => {
    const available: AvailableMonth[] = [];
    const errors: Error[] = [];
    let pending = false;

    results.forEach((r: UseQueryResult<MonthManifest | null, Error>, i) => {
      const c = candidates[i];
      if (r.isPending) pending = true;
      if (r.error) errors.push(r.error);
      if (r.data) {
        available.push({
          year: c.year,
          month: c.month,
          key: `${c.year}_${c.month}`,
          manifest: r.data,
        });
      }
    });

    available.sort((a, b) => (b.year - a.year) || (b.month - a.month));
    return { available, isLoading: pending, errors };
  }, [results, candidates]);
}
