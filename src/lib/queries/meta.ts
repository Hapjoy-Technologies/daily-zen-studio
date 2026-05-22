import { useQuery } from '@tanstack/react-query';
import { getAuthors, getStats, getThemes } from '@/lib/api/meta';
import { queryKeys } from './keys';

export function useThemes() {
  return useQuery({
    queryKey: queryKeys.themes,
    queryFn: getThemes,
    staleTime: 5 * 60_000,
  });
}

export function useAuthors() {
  return useQuery({
    queryKey: queryKeys.authors,
    queryFn: getAuthors,
    staleTime: 5 * 60_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: getStats,
    staleTime: 5 * 60_000,
  });
}
