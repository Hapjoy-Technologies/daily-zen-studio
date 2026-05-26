'use client';
import * as React from 'react';
import { Box, ButtonBase, IconButton, Stack, Typography, alpha } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
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
  const label = THEME_LABELS[theme] ?? theme;

  if (!card) {
    return (
      <ButtonBase
        onClick={onClick}
        disabled={readOnly}
        sx={(t) => ({
          width: '100%',
          textAlign: 'left',
          borderRadius: 2.5,
          border: `1.5px solid ${alpha(accent, 0.32)}`,
          backgroundColor: alpha(accent, 0.04),
          px: 1.25,
          py: 1,
          minHeight: 60,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          color: t.palette.text.secondary,
          transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
          '&:hover': {
            borderColor: accent,
            backgroundColor: alpha(accent, 0.10),
            color: accent,
            transform: 'translateY(-1px)',
          },
          '&.Mui-disabled': { opacity: 0.5 },
        })}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: alpha(accent, 0.16),
            color: accent,
            flexShrink: 0,
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: accent, fontWeight: 700, display: 'block', lineHeight: 1.2 }}
          >
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pick a card
          </Typography>
        </Box>
      </ButtonBase>
    );
  }

  return (
    <Box
      sx={(t) => ({
        position: 'relative',
        borderRadius: 2.5,
        backgroundColor: t.palette.background.paper,
        border: `1px solid ${t.palette.divider}`,
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 1px 2px rgba(46, 16, 24, 0.04)',
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        '&:hover': {
          transform: readOnly ? 'none' : 'translateY(-1px)',
          boxShadow: readOnly
            ? '0 1px 2px rgba(46, 16, 24, 0.04)'
            : `0 6px 20px -8px ${alpha(accent, 0.40)}`,
        },
      })}
    >
      <ButtonBase
        onClick={onClick}
        disabled={readOnly}
        sx={{
          width: '100%',
          textAlign: 'left',
          display: 'block',
          borderRadius: 2,
          px: 1.25,
          py: 1,
          '&.Mui-disabled': { color: 'text.primary' },
        }}
      >
        <Stack direction="row" gap={1} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              overflow: 'hidden',
              backgroundImage: card.latestDzImageUrl
                ? undefined
                : `linear-gradient(135deg, ${alpha(accent, 0.3)} 0%, ${alpha(accent, 0.1)} 100%)`,
              backgroundColor: alpha(accent, 0.15),
              flexShrink: 0,
            }}
          >
            {card.latestDzImageUrl && (
              <Box
                component="img"
                src={card.latestDzImageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: accent, fontWeight: 700, display: 'block', lineHeight: 1.2 }}
            >
              {label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'text.primary',
                wordBreak: 'break-all',
              }}
            >
              {card.text || card.articleUrl || card.themeTitle || '(blog/story)'}
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
          sx={(t) => ({
            position: 'absolute',
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            color: t.palette.text.secondary,
            '&:hover': { color: t.palette.error.main, bgcolor: alpha(t.palette.error.main, 0.08) },
          })}
          aria-label="Clear slot"
        >
          <CloseRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </Box>
  );
}
