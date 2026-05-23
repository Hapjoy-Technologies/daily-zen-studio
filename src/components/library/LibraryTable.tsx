'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import { useInfiniteCards, useSearchCards } from '@/lib/queries/cards';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import type { LibraryFilterState, SortKey } from './LibraryFilters';
import { CardPreview } from '@/components/common/CardPreview';
import { ThemeChip } from '@/components/common/ThemeChip';

function sortCards(items: LibraryCard[], sort: SortKey): LibraryCard[] {
  const arr = [...items];
  switch (sort) {
    case 'lru':
      return arr.sort((a, b) => (a.lastUsedOn ?? '').localeCompare(b.lastUsedOn ?? ''));
    case 'mru':
      return arr.sort((a, b) => (b.lastUsedOn ?? '').localeCompare(a.lastUsedOn ?? ''));
    case 'most':
      return arr.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
    case 'alpha':
      return arr.sort((a, b) => (a.text ?? '').localeCompare(b.text ?? ''));
  }
}

function applyClientFilters(
  items: LibraryCard[],
  filters: Pick<LibraryFilterState, 'theme' | 'status' | 'author'>,
): LibraryCard[] {
  return items.filter((c) => {
    if (filters.theme && c.theme !== filters.theme) return false;
    if (filters.status && (c.status ?? 'active') !== filters.status) return false;
    if (filters.author && c.author !== filters.author) return false;
    return true;
  });
}

export function LibraryTable({
  filters,
  onRowClick,
}: {
  filters: LibraryFilterState;
  onRowClick: (card: LibraryCard) => void;
}) {
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const searchActive = debouncedSearch.trim().length > 0;

  // Branch on whether the user is searching:
  //  - searching → hit /cards/search (server scans the full library) and filter
  //    theme/status/author client-side over the result set (already small).
  //  - not searching → keep the GSI-backed paginated fetch unchanged.
  const infinite = useInfiniteCards({
    theme: filters.theme ?? undefined,
    author: filters.author ?? undefined,
    status: filters.status || undefined,
  });
  const search = useSearchCards(searchActive ? debouncedSearch : '');

  const { items, totalLoaded, totalMatches, isLoading, hasNextPage, isFetchingNextPage, error } =
    React.useMemo(() => {
      if (searchActive) {
        const raw = search.data?.items ?? [];
        return {
          items: raw,
          totalLoaded: raw.length,
          totalMatches: search.data?.count ?? raw.length,
          isLoading: search.isLoading,
          hasNextPage: false as boolean,
          isFetchingNextPage: false as boolean,
          error: search.error,
        };
      }
      const flat = infinite.data?.pages.flatMap((p) => p.items) ?? [];
      return {
        items: flat,
        totalLoaded: flat.length,
        totalMatches: null as number | null,
        isLoading: infinite.isLoading,
        hasNextPage: Boolean(infinite.hasNextPage),
        isFetchingNextPage: infinite.isFetchingNextPage,
        error: infinite.error,
      };
    }, [searchActive, search, infinite]);

  const visible = React.useMemo(() => {
    // Re-apply theme/status/author client-side over search results so combo
    // filters still narrow things down.
    const filtered = searchActive ? applyClientFilters(items, filters) : items;
    return sortCards(filtered, filters.sort);
  }, [items, searchActive, filters]);

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load library.'}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 88 }}></TableCell>
                <TableCell>Card</TableCell>
                <TableCell sx={{ width: 140 }}>Theme</TableCell>
                <TableCell sx={{ width: 200 }}>Author</TableCell>
                <TableCell sx={{ width: 120 }} align="right">Used</TableCell>
                <TableCell sx={{ width: 140 }}>Last used</TableCell>
                <TableCell sx={{ width: 100 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((c) => (
                <TableRow
                  key={c.cardId}
                  hover
                  onClick={() => onRowClick(c)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <CardPreview card={c} size="sm" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {c.text || c.themeTitle || '(blog/story)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.cardId}
                    </Typography>
                  </TableCell>
                  <TableCell><ThemeChip theme={c.theme} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>{c.author || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">{c.usageCount ?? 0}</TableCell>
                  <TableCell>{c.lastUsedOn || '—'}</TableCell>
                  <TableCell>{c.status || 'active'}</TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                      {searchActive
                        ? `No cards match "${debouncedSearch}".`
                        : 'No cards match these filters.'}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          {searchActive
            ? totalMatches !== null && totalMatches > totalLoaded
              ? `Showing ${visible.length} of ${totalMatches} matches across the full library`
              : `Showing ${visible.length} match${visible.length === 1 ? '' : 'es'} across the full library`
            : `Loaded ${totalLoaded} card${totalLoaded === 1 ? '' : 's'}`}
        </Typography>
        {!searchActive && hasNextPage && (
          <Button
            onClick={() => infinite.fetchNextPage()}
            disabled={isFetchingNextPage}
            startIcon={isFetchingNextPage ? <CircularProgress size={16} /> : null}
            variant="outlined"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        )}
        {isLoading && <CircularProgress size={20} />}
      </Stack>
    </Stack>
  );
}
