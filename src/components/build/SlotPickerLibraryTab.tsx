'use client';
import * as React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { LibraryCard, SortKey } from '@/lib/api/types';
import { useInfiniteCards } from '@/lib/queries/cards';
import { useAuthors } from '@/lib/queries/meta';
import { CardPreview } from '@/components/common/CardPreview';
import { SORT_LABEL } from '@/components/library/LibraryFilters';

export function SlotPickerLibraryTab({
  theme,
  onPick,
}: {
  theme: string;
  onPick: (card: LibraryCard) => void;
}) {
  const [search, setSearch] = React.useState('');
  const [sort, setSort] = React.useState<SortKey>('lru');
  const [author, setAuthor] = React.useState<string | null>(null);

  const query = useInfiniteCards({
    theme,
    status: 'active',
    sort,
    author: author ?? undefined,
  });
  const authors = useAuthors();

  // Server returns the slice pre-sorted; we still filter client-side by the
  // free-text needle over what's been loaded so far. Full-library search
  // inside the picker is intentionally out of scope.
  const items = React.useMemo<LibraryCard[]>(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((c) =>
      `${c.text ?? ''} ${c.author ?? ''} ${c.articleUrl ?? ''}`.toLowerCase().includes(needle),
    );
  }, [query.data, search]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
        <TextField
          placeholder="Search by text or author"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          autoFocus
        />
        <Autocomplete
          size="small"
          options={authors.data ?? []}
          getOptionLabel={(o) => `${o.author} (${o.count} active)`}
          value={authors.data?.find((a) => a.author === author) ?? null}
          onChange={(_, v) => setAuthor(v?.author ?? null)}
          loading={authors.isLoading}
          sx={{ minWidth: 200, flex: 1 }}
          renderInput={(p) => <TextField {...p} label="Author" />}
        />
        <TextField
          select
          size="small"
          label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          sx={{ minWidth: 180 }}
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <MenuItem key={k} value={k}>
              {SORT_LABEL[k]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {query.isError && (
        <Alert severity="error">
          {query.error instanceof Error ? query.error.message : 'Failed to load library.'}
        </Alert>
      )}

      <Box sx={{ maxHeight: '60vh', overflowY: 'auto', border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2 }}>
        <List dense disablePadding>
          {items.map((c) => (
            <ListItemButton
              key={c.cardId}
              onClick={() => onPick(c)}
              sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, gap: 1.5, py: 1 }}
            >
              <CardPreview card={c} size="sm" />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                  {c.text || c.articleUrl || c.themeTitle || '(blog/story)'}
                </Typography>
                {c.author && (
                  <Typography variant="caption" color="text.secondary">— {c.author}</Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Used {c.usageCount ?? 0}× · last {c.lastUsedOn || 'never'}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
          {items.length === 0 && !query.isLoading && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No cards match.
            </Box>
          )}
        </List>
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {items.length} card{items.length === 1 ? '' : 's'} shown · sort: {SORT_LABEL[sort]}
        </Typography>
        {query.hasNextPage && (
          <Button
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            size="small"
            variant="outlined"
            startIcon={query.isFetchingNextPage ? <CircularProgress size={14} /> : null}
          >
            Load more
          </Button>
        )}
        {query.isLoading && <CircularProgress size={20} />}
      </Stack>
    </Stack>
  );
}
