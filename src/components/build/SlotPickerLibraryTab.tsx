'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import { useInfiniteCards } from '@/lib/queries/cards';
import { CardPreview } from '@/components/common/CardPreview';

export function SlotPickerLibraryTab({
  theme,
  onPick,
}: {
  theme: string;
  onPick: (card: LibraryCard) => void;
}) {
  const query = useInfiniteCards({ theme, status: 'active' });
  const [search, setSearch] = React.useState('');

  const items = React.useMemo<LibraryCard[]>(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    // Sort by least-recently-used (ascending lastUsedOn; empty = never used = top).
    const sorted = [...all].sort((a, b) =>
      (a.lastUsedOn || '0000-00-00').localeCompare(b.lastUsedOn || '0000-00-00'),
    );
    const needle = search.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((c) =>
      `${c.text ?? ''} ${c.author ?? ''}`.toLowerCase().includes(needle),
    );
  }, [query.data, search]);

  return (
    <Stack spacing={2}>
      <TextField
        placeholder="Search by text or author"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        autoFocus
      />

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
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.text || c.themeTitle || '(blog/story)'}
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
          {items.length} card{items.length === 1 ? '' : 's'} shown · sorted by least-recently-used
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
