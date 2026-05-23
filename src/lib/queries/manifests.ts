import { useQuery } from '@tanstack/react-query';
import { fetchPastManifest } from '@/lib/api/manifests';

const STALE_FOREVER = 24 * 60 * 60_000; // 1 day — published manifests don't change.

function manifestKey(year: number, month: number) {
  return ['past-manifest', year, month] as const;
}

/**
 * Fetches a single month's manifest on demand. Used by the Past Months page
 * to load only the currently selected month — no parallel probing.
 */
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
