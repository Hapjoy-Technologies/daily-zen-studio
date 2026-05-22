'use client';
import * as React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthManifest, ManifestEntry } from '@/lib/manifest/types';
import { THEME_ORDER, THEME_TITLES } from '@/lib/constants';
import { dayOfWeek, listMonthDates } from '@/lib/date';
import { manifestDateKey } from '@/lib/manifest/build';
import { SlotButton } from '@/components/build/SlotButton';

/** Adapt a manifest entry back into the LibraryCard shape just so SlotButton can render it. */
function entryToLibraryCard(e: ManifestEntry): LibraryCard {
  return {
    cardId: e.uniqueId,
    theme: e.theme,
    themeTitle: e.themeTitle || THEME_TITLES[e.theme] || e.theme,
    type: e.type,
    dzType: e.dzType,
    status: 'active',
    text: e.text,
    author: e.author,
    articleUrl: e.articleUrl,
    latestBgImageUrl: e.bgImageUrl,
    latestDzImageUrl: e.dzImageUrl,
    primaryCTAText: e.primaryCTAText,
    sharePrefix: e.sharePrefix,
  };
}

export function PastMonthView({
  year,
  month,
  manifest,
}: {
  year: number;
  month: number;
  manifest: MonthManifest;
}) {
  const dates = listMonthDates(year, month);

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
        const entries = manifest[manifestDateKey(d)] ?? [];
        const byTheme = new Map<string, ManifestEntry>();
        for (const e of entries) byTheme.set(e.theme, e);

        return (
          <Paper key={d} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="baseline" gap={1} sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{day}</Typography>
              <Typography variant="caption" color="text.secondary">{dowLabel}</Typography>
            </Stack>
            <Stack spacing={0.75}>
              {THEME_ORDER.map((t) => {
                const entry = byTheme.get(t);
                return (
                  <SlotButton
                    key={t}
                    theme={t}
                    card={entry ? entryToLibraryCard(entry) : null}
                    onClick={() => {
                      /* read-only: noop */
                    }}
                    readOnly
                  />
                );
              })}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
