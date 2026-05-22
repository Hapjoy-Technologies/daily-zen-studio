'use client';
import * as React from 'react';
import { Box, ButtonBase, IconButton, Stack, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import type { LibraryCard } from '@/lib/api/types';
import { THEME_LABELS } from '@/lib/constants';
import { themeAccent } from '@/lib/theme/tokens';

export function SlotButton({
  theme,
  card,
  onClick,
  onClear,
  readOnly,
}: {
  theme: string;
  card: LibraryCard | null;
  onClick: () => void;
  onClear?: () => void;
  readOnly?: boolean;
}) {
  const accent = themeAccent[theme] ?? '#888';

  if (!card) {
    return (
      <ButtonBase
        onClick={onClick}
        disabled={readOnly}
        sx={{
          width: '100%',
          textAlign: 'left',
          borderRadius: 1,
          border: (t) => `1px dashed ${t.palette.divider}`,
          p: 1,
          minHeight: 60,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          color: 'text.secondary',
          ':hover': { bgcolor: 'action.hover' },
        }}
      >
        <AddCircleOutlineIcon fontSize="small" sx={{ color: accent }} />
        <Box>
          <Typography variant="caption" sx={{ color: accent, fontWeight: 700, display: 'block' }}>
            {THEME_LABELS[theme] ?? theme}
          </Typography>
          <Typography variant="caption" color="text.secondary">Pick a card</Typography>
        </Box>
      </ButtonBase>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1,
        border: (t) => `1px solid ${t.palette.divider}`,
        p: 1,
        minHeight: 60,
        bgcolor: 'background.paper',
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <ButtonBase
        onClick={onClick}
        disabled={readOnly}
        sx={{ width: '100%', textAlign: 'left', display: 'block', borderRadius: 0.5 }}
      >
        <Stack direction="row" gap={1} alignItems="center">
          {card.latestDzImageUrl && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 0.5,
                backgroundImage: `url(${card.latestBgImageUrl})`,
                backgroundSize: 'cover',
                position: 'relative',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.latestDzImageUrl}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: accent, fontWeight: 700, display: 'block', lineHeight: 1.2 }}
            >
              {THEME_LABELS[theme] ?? theme}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {card.text || card.themeTitle || '(blog/story)'}
            </Typography>
            {card.author && (
              <Typography variant="caption" color="text.secondary">— {card.author}</Typography>
            )}
          </Box>
        </Stack>
      </ButtonBase>
      {onClear && !readOnly && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          sx={{ position: 'absolute', top: 2, right: 2 }}
          aria-label="Clear slot"
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Box>
  );
}
