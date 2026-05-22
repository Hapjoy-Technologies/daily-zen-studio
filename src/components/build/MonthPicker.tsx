'use client';
import * as React from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { formatMonth, nextMonth, prevMonth } from '@/lib/date';

export function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <IconButton
        onClick={() => {
          const p = prevMonth(year, month);
          onChange(p.year, p.month);
        }}
        aria-label="Previous month"
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="h5" sx={{ minWidth: 180, textAlign: 'center', fontWeight: 700 }}>
        {formatMonth(year, month)}
      </Typography>
      <IconButton
        onClick={() => {
          const n = nextMonth(year, month);
          onChange(n.year, n.month);
        }}
        aria-label="Next month"
      >
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
}
