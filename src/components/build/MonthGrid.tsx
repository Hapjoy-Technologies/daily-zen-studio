'use client';
import * as React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthDraft } from '@/lib/manifest/types';
import { THEME_ORDER } from '@/lib/constants';
import { dayOfWeek, listMonthDates } from '@/lib/date';
import { SlotButton } from './SlotButton';

export function MonthGrid({
  year,
  month,
  draft,
  onSlotClick,
  onSlotClear,
  readOnly,
}: {
  year: number;
  month: number;
  draft: MonthDraft;
  onSlotClick: (date: string, theme: string) => void;
  onSlotClear?: (date: string, theme: string) => void;
  readOnly?: boolean;
}) {
  const dates = React.useMemo(() => listMonthDates(year, month), [year, month]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {dates.map((d) => {
        const day = Number(d.slice(8, 10));
        const dow = dayOfWeek(year, month, day);
        const dowLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow];
        const slots = draft.days[d] ?? {};
        return (
          <Paper
            key={d}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {day}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                {dowLabel}
              </Typography>
              <SlotCount slots={slots} />
            </Stack>
            <Stack spacing={0.75}>
              {THEME_ORDER.map((t) => (
                <SlotButton
                  key={t}
                  theme={t}
                  card={slots[t] ?? null}
                  onClick={() => onSlotClick(d, t)}
                  onClear={onSlotClear ? () => onSlotClear(d, t) : undefined}
                  readOnly={readOnly}
                />
              ))}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}

function SlotCount({ slots }: { slots: Partial<Record<string, LibraryCard>> }) {
  const filled = THEME_ORDER.filter((t) => slots[t]).length;
  const color = filled === 6 ? 'success.main' : filled === 0 ? 'text.secondary' : 'warning.main';
  return (
    <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
      {filled}/6
    </Typography>
  );
}
