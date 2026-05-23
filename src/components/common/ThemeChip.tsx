'use client';
import * as React from 'react';
import { Chip, alpha, type ChipProps } from '@mui/material';
import { THEME_LABELS } from '@/lib/constants';
import { themeAccent } from '@/lib/theme/tokens';

/**
 * Candy-pastel chip — soft fill, deeper-colored text/border that picks up
 * the per-theme accent (so themes are quickly distinguishable at a glance).
 */
export function ThemeChip({
  theme,
  size = 'small',
  variant = 'filled',
}: { theme: string } & Pick<ChipProps, 'size' | 'variant'>) {
  const color = themeAccent[theme] ?? '#9C9C9C';
  const label = THEME_LABELS[theme] ?? theme;
  return (
    <Chip
      size={size}
      variant={variant}
      label={label}
      sx={{
        bgcolor: variant === 'filled' ? alpha(color, 0.18) : 'transparent',
        color,
        borderColor: alpha(color, 0.5),
        borderWidth: variant === 'outlined' ? 1.5 : 0,
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}
    />
  );
}
