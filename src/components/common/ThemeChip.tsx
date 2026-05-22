'use client';
import * as React from 'react';
import { Chip, type ChipProps } from '@mui/material';
import { THEME_LABELS } from '@/lib/constants';
import { themeAccent } from '@/lib/theme/tokens';

export function ThemeChip({
  theme,
  size = 'small',
  variant = 'filled',
}: { theme: string } & Pick<ChipProps, 'size' | 'variant'>) {
  const color = themeAccent[theme] ?? '#888';
  const label = THEME_LABELS[theme] ?? theme;
  return (
    <Chip
      size={size}
      variant={variant}
      label={label}
      sx={{
        bgcolor: variant === 'filled' ? `${color}1F` : 'transparent',
        color,
        borderColor: color,
        fontWeight: 600,
      }}
    />
  );
}
