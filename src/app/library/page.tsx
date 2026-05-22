'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { LibraryCard } from '@/lib/api/types';
import { useCreateCard } from '@/lib/queries/cards';
import { LibraryFilters, type LibraryFilterState } from '@/components/library/LibraryFilters';
import { LibraryTable } from '@/components/library/LibraryTable';
import { CardDrawer } from '@/components/library/CardDrawer';
import { CardForm } from '@/components/library/CardForm';

const DEFAULT_FILTERS: LibraryFilterState = {
  theme: null,
  status: 'active',
  author: null,
  search: '',
  sort: 'lru',
  includeRetired: false,
};

export default function LibraryPage() {
  const [filters, setFilters] = React.useState<LibraryFilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = React.useState<LibraryCard | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const createCard = useCreateCard();

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Library</Typography>
          <Typography variant="body2" color="text.secondary">
            Browse, edit, and add cards. The library backs the monthly builder.
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
          New card
        </Button>
      </Stack>

      <LibraryFilters state={filters} onChange={setFilters} />

      <LibraryTable filters={filters} onRowClick={setSelected} />

      <CardDrawer
        card={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New card</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <CardForm
            submitLabel="Create card"
            submitting={createCard.isPending}
            onSubmit={(values) => {
              setCreateError(null);
              createCard.mutate(values, {
                onSuccess: () => setCreateOpen(false),
                onError: (e) =>
                  setCreateError(e instanceof Error ? e.message : 'Create failed.'),
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
