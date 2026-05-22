'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import type { LibraryCard } from '@/lib/api/types';
import { useDeleteCard, useUpdateCard } from '@/lib/queries/cards';
import { CardForm } from './CardForm';
import { CardPreview } from '@/components/common/CardPreview';
import { ThemeChip } from '@/components/common/ThemeChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export function CardDrawer({
  card,
  open,
  onClose,
}: {
  card: LibraryCard | null;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateCard();
  const del = useDeleteCard();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
  }, [card?.cardId]);

  if (!card) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 600 }, p: 3 } }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="h6" sx={{ flex: 1 }}>Edit card</Typography>
          <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
        </Stack>

        <Stack direction="row" gap={2} alignItems="center">
          <CardPreview card={card} size="sm" />
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
            <ThemeChip theme={card.theme} />
            <Typography variant="caption" color="text.secondary">
              cardId: <code>{card.cardId}</code>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Used {card.usageCount ?? 0}× · last {card.lastUsedOn || '—'} · first{' '}
              {card.firstUsedOn || '—'}
            </Typography>
            {card.usageHistory && card.usageHistory.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                Used on: {card.usageHistory.slice(-12).join(', ')}
                {card.usageHistory.length > 12 ? ' …' : ''}
              </Typography>
            )}
          </Stack>
        </Stack>

        <CardForm
          initial={card}
          submitLabel="Save changes"
          submitting={update.isPending}
          error={error}
          onSubmit={(values) => {
            setError(null);
            update.mutate(
              { cardId: card.cardId, patch: values },
              {
                onSuccess: onClose,
                onError: (e) => setError(e instanceof Error ? e.message : 'Failed to save.'),
              },
            );
          }}
        />

        <Box sx={{ borderTop: (t) => `1px solid ${t.palette.divider}`, pt: 2 }}>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={() => setConfirmDelete(true)}
            disabled={del.isPending}
          >
            Delete card
          </Button>
        </Box>

        {del.error && (
          <Alert severity="error">{del.error instanceof Error ? del.error.message : 'Delete failed.'}</Alert>
        )}
      </Stack>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this card?"
        body={`This removes the card from the library. Past manifests that already reference it are unaffected.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          del.mutate(card.cardId, {
            onSuccess: () => {
              setConfirmDelete(false);
              onClose();
            },
          });
        }}
      />
    </Drawer>
  );
}
