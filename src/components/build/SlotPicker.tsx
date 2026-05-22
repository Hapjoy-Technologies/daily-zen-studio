'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { LibraryCard } from '@/lib/api/types';
import { useCreateCard } from '@/lib/queries/cards';
import { CardForm } from '@/components/library/CardForm';
import { SlotPickerLibraryTab } from './SlotPickerLibraryTab';
import { THEME_LABELS } from '@/lib/constants';

export function SlotPicker({
  open,
  date,
  theme,
  onClose,
  onAssign,
}: {
  open: boolean;
  date: string;
  theme: string;
  onClose: () => void;
  onAssign: (card: LibraryCard) => void;
}) {
  const [tab, setTab] = React.useState<'library' | 'create'>('library');
  const [createError, setCreateError] = React.useState<string | null>(null);
  const createCard = useCreateCard();

  // Reset to library tab whenever the picker opens for a new slot.
  React.useEffect(() => {
    if (open) {
      setTab('library');
      setCreateError(null);
    }
  }, [open, date, theme]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            {date}
          </Typography>
          <Typography variant="h6">
            Pick a {THEME_LABELS[theme] ?? theme} card
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Tab value="library" label="From library" />
        <Tab value="create" label="Create new" />
      </Tabs>

      <DialogContent sx={{ pt: 2 }}>
        {tab === 'library' && (
          <SlotPickerLibraryTab theme={theme} onPick={onAssign} />
        )}
        {tab === 'create' && (
          <Box>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <CardForm
              lockedTheme={theme}
              submitLabel="Create + assign"
              submitting={createCard.isPending}
              onSubmit={(values) => {
                setCreateError(null);
                createCard.mutate(values, {
                  onSuccess: (created) => onAssign(created),
                  onError: (e) =>
                    setCreateError(e instanceof Error ? e.message : 'Create failed.'),
                });
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
