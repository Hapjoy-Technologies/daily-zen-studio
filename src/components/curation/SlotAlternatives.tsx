'use client';
import * as React from 'react';
import { Box, ButtonBase, Popover, Stack, Typography } from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import { THEME_LABELS } from '@/lib/constants';
import { CardPreview } from '@/components/common/CardPreview';

export type AltReason = 'used' | 'author' | null;

/** "https://blog.../thank-you-note-examples/?open=InApp" -> "Thank you note examples". */
export function articleTitle(url?: string | null): string {
  if (!url) return '';
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const slug = decodeURIComponent(parts[parts.length - 1] ?? '').replace(/[-_]+/g, ' ').trim();
    return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : url;
  } catch {
    return url;
  }
}

/** What a reviewer should read for a card: its text, or an article's title. */
export function cardLabel(card: LibraryCard): string {
  return card.text || articleTitle(card.articleUrl) || card.themeTitle;
}

/**
 * Up to five alternatives the curator found for a slot: cards that passed every
 * rule for the generated month. Ones that clash with the month as it stands now
 * (already used, or the same author within 7 days) are shown but disabled.
 */
export function SlotAlternatives({
  anchorEl,
  theme,
  date,
  alternatives,
  cardsById,
  blockedReason,
  onPick,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  theme: string;
  date: string;
  alternatives: string[];
  cardsById: ReadonlyMap<string, LibraryCard>;
  blockedReason: (cardId: string) => AltReason;
  onPick: (cardId: string) => void;
  onClose: () => void;
}) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { width: 420, maxWidth: '90vw', p: 1.5, borderRadius: 3 } } }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
        Alternatives for {THEME_LABELS[theme] ?? theme} · {date}
      </Typography>
      {alternatives.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No alternatives were saved for this slot. Use the editor&apos;s picker after applying.
        </Typography>
      )}
      <Stack spacing={0.75}>
        {alternatives.map((id) => {
          const card = cardsById.get(id);
          const reason = blockedReason(id);
          return (
            <ButtonBase
              key={id}
              disabled={!card || reason !== null}
              onClick={() => onPick(id)}
              sx={(t) => ({
                display: 'block',
                textAlign: 'left',
                borderRadius: 2,
                border: `1px solid ${t.palette.divider}`,
                px: 1,
                py: 0.75,
                '&:hover': { backgroundColor: t.palette.action.hover },
                '&.Mui-disabled': { opacity: 0.45 },
              })}
            >
              <Stack direction="row" gap={1} alignItems="center">
                {card && <CardPreview card={card} size="xs" />}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {card ? cardLabel(card) : 'Card not found in the library'}
                  </Typography>
                  {card?.author && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      — {card.author}
                    </Typography>
                  )}
                  {reason && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                      {reason === 'used' ? 'Already in this month' : 'Same author within 7 days'}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>
    </Popover>
  );
}
