import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  discardMonthDraft,
  getMonth,
  listMonths,
  publishMonth,
  saveMonthDraft,
} from '@/lib/api/months';
import { lookupCards } from '@/lib/api/cards';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthIdMap, MonthRow } from '@/lib/manifest/types';
import { queryKeys } from './keys';

const MONTHS_STALE = 60_000;

export function useMonths() {
  return useQuery({
    queryKey: queryKeys.months,
    queryFn: listMonths,
    staleTime: MONTHS_STALE,
  });
}

export function useMonth(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.month(year, month),
    queryFn: () => getMonth(year, month),
    enabled,
    staleTime: MONTHS_STALE,
  });
}

/**
 * Resolve a batch of cardIds via POST /cards/lookup. Used by the Month
 * editor to render all slots and again by the Publish flow to build the
 * downloadable manifest. The returned `cardsById` is the lookup-ready Map.
 */
export function useCardsLookup(ids: readonly string[], enabled = true) {
  return useQuery({
    queryKey: queryKeys.cardsLookup(ids),
    queryFn: async () => {
      const res = await lookupCards([...ids]);
      const cardsById = new Map<string, LibraryCard>(res.items.map((c) => [c.cardId, c]));
      return { cardsById, missing: res.missing };
    },
    enabled: enabled && ids.length > 0,
    staleTime: MONTHS_STALE,
  });
}

export function useSaveMonthDraft(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      draft,
      ifMatch,
      dzImageUrlStartIndex,
    }: {
      draft: MonthIdMap;
      ifMatch: number | null;
      /** Optional. Set during Figma import to persist the per-month start index. */
      dzImageUrlStartIndex?: number | null;
    }) => saveMonthDraft(year, month, draft, ifMatch, dzImageUrlStartIndex),
    onSuccess: (row: MonthRow) => {
      qc.setQueryData(queryKeys.month(year, month), row);
      qc.invalidateQueries({ queryKey: queryKeys.months });
    },
  });
}

export function usePublishMonth(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishMonth(year, month),
    onSuccess: (row: MonthRow) => {
      qc.setQueryData(queryKeys.month(year, month), row);
      qc.invalidateQueries({ queryKey: queryKeys.months });
      // Publish rolls referenced cards' usage history forward server-side,
      // so the library page needs fresh data to show the new LRU / counts.
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useDiscardMonthDraft(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => discardMonthDraft(year, month),
    onSuccess: (row: MonthRow | null) => {
      if (row) {
        qc.setQueryData(queryKeys.month(year, month), row);
      } else {
        qc.removeQueries({ queryKey: queryKeys.month(year, month) });
      }
      qc.invalidateQueries({ queryKey: queryKeys.months });
    },
  });
}
