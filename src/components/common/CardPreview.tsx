'use client';
import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import { ThemeChip } from './ThemeChip';

/**
 * Visual preview of a library card — uses latestBgImageUrl as the gradient backdrop
 * and overlays latestDzImageUrl + text + author.
 */
export function CardPreview({
  card,
  size = 'sm',
}: {
  card: LibraryCard;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 240 : size === 'md' ? 160 : 96;
  return (
    <Box
      sx={{
        position: 'relative',
        width: dim,
        height: dim,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundImage: card.latestBgImageUrl ? `url(${card.latestBgImageUrl})` : undefined,
        backgroundColor: 'surfaceContainer',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: (t) => `1px solid ${t.palette.divider}`,
        flexShrink: 0,
      }}
    >
      {card.latestDzImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.latestDzImageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
          }}
        />
      )}
    </Box>
  );
}

export function CardSummary({ card }: { card: LibraryCard }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Stack direction="row" gap={1} alignItems="center">
        <ThemeChip theme={card.theme} />
        {card.status === 'retired' && <ThemeChip theme="retired" variant="outlined" />}
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
        {card.text || card.themeTitle || '(no text)'}
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
