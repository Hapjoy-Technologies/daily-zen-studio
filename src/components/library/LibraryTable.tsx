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
import { useInfiniteCards } from '@/lib/queries/cards';
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

function applySearch(items: LibraryCard[], q: string): LibraryCard[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((c) =>
    `${c.text ?? ''} ${c.author ?? ''} ${c.themeTitle ?? ''}`.toLowerCase().includes(needle),
  );
}

export function LibraryTable({
  filters,
  onRowClick,
}: {
  filters: LibraryFilterState;
  onRowClick: (card: LibraryCard) => void;
}) {
  const query = useInfiniteCards({
    theme: filters.theme ?? undefined,
    author: filters.author ?? undefined,
    status: filters.status || undefined,
  });

  const flat = React.useMemo<LibraryCard[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const filtered = React.useMemo(() => {
    const searched = applySearch(flat, filters.search);
    return sortCards(searched, filters.sort);
  }, [flat, filters.search, filters.sort]);

  return (
    <Stack spacing={2}>
      {query.isError && (
        <Alert severity="error">
          {query.error instanceof Error ? query.error.message : 'Failed to load library.'}
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
              {filtered.map((c) => (
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
              {filtered.length === 0 && !query.isLoading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                      No cards match these filters.
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          Loaded {flat.length} card{flat.length === 1 ? '' : 's'}
          {filters.search ? ` · ${filtered.length} match${filtered.length === 1 ? '' : 'es'} for "${filters.search}"` : ''}
        </Typography>
        {query.hasNextPage && (
          <Button
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            startIcon={query.isFetchingNextPage ? <CircularProgress size={16} /> : null}
            variant="outlined"
          >
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        )}
        {query.isLoading && <CircularProgress size={20} />}
      </Stack>
    </Stack>
  );
}
