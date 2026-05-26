'use client';
import * as React from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import { themeAccent } from '@/lib/theme/tokens';
import { ThemeChip } from './ThemeChip';
import { ImageViewerDialog } from './ImageViewerDialog';

/**
 * Square thumbnail of a library card's dz image.
 *
 * Lazy-loaded — uses native <img loading="lazy"> so off-screen rows don't
 * fire image requests until the user scrolls them into view. Clicking the
 * thumbnail opens a full-size preview dialog; the click is stopped from
 * bubbling so parent-row click handlers (edit drawer, slot picker) don't
 * also fire.
 */
export function CardPreview({
  card,
  size = 'sm',
  enableZoom = true,
}: {
  card: LibraryCard;
  size?: 'sm' | 'md' | 'lg';
  /** Set to false to opt out of the click-to-preview behavior (and the cursor). */
  enableZoom?: boolean;
}) {
  const dim = size === 'lg' ? 240 : size === 'md' ? 160 : 96;
  const accent = themeAccent[card.theme] ?? '#E84A7A';
  const fallback = `linear-gradient(135deg, ${alpha(accent, 0.30)} 0%, ${alpha(accent, 0.10)} 100%)`;
  const [open, setOpen] = React.useState(false);

  const hasImage = Boolean(card.latestDzImageUrl);
  const interactive = enableZoom && hasImage;

  const inner = hasImage ? (
    <Box
      component="img"
      src={card.latestDzImageUrl}
      alt={card.text || card.themeTitle || ''}
      loading="lazy"
      decoding="async"
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  ) : null;

  const surfaceSx = {
    position: 'relative' as const,
    width: dim,
    height: dim,
    borderRadius: 2.5,
    overflow: 'hidden',
    backgroundImage: hasImage ? undefined : fallback,
    backgroundColor: alpha(accent, 0.08),
    border: (t: { palette: { divider: string } }) => `1px solid ${t.palette.divider}`,
    boxShadow: `0 1px 2px ${alpha(accent, 0.10)}`,
    flexShrink: 0,
    p: 0,
  };

  if (interactive) {
    const openPreview = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      setOpen(true);
    };

    return (
      <>
        <Box
          role="button"
          tabIndex={0}
          aria-label="View full-size image"
          onClick={openPreview}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPreview(e);
            }
          }}
          sx={{
            ...surfaceSx,
            cursor: 'zoom-in',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              transform: 'scale(1.03)',
              boxShadow: `0 6px 18px -6px ${alpha(accent, 0.40)}`,
            },
            '&:focus-visible': {
              outline: (t: { palette: { primary: { main: string } } }) =>
                `2px solid ${t.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          {inner}
        </Box>
        <ImageViewerDialog card={card} open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return <Box sx={surfaceSx}>{inner}</Box>;
}

export function CardSummary({ card }: { card: LibraryCard }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Stack direction="row" gap={1} alignItems="center">
        <ThemeChip theme={card.theme} />
        {card.status === 'retired' && <ThemeChip theme="retired" variant="outlined" />}
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {card.text || card.articleUrl || card.themeTitle || '(no text)'}
      </Typography>
      {card.author && (
        <Typography variant="caption" color="text.secondary" noWrap>
          — {card.author}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        Used {card.usageCount ?? 0}× · last on {card.lastUsedOn || '—'}
      </Typography>
    </Stack>
  );
}
