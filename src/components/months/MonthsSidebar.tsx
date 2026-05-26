'use client';
import * as React from 'react';
import {
  Box,
  Chip,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import type { MonthStatus, MonthSummary } from '@/lib/manifest/types';
import { nextMonth } from '@/lib/date';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Selection = { year: number; month: number };

const STATUS_LABEL: Record<MonthStatus, string> = {
  published: 'Published',
  'draft-changes': 'Draft changes',
  'unpublished-draft': 'Unpublished',
  'not-built': 'Not built',
};

const STATUS_COLOR: Record<MonthStatus, 'success' | 'warning' | 'info' | 'default'> = {
  published: 'success',
  'draft-changes': 'warning',
  'unpublished-draft': 'info',
  'not-built': 'default',
};

function statusChip(status: MonthStatus) {
  return (
    <Chip
      label={STATUS_LABEL[status]}
      color={STATUS_COLOR[status]}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
}

/**
 * Build the merged list of months to show in the sidebar:
 *  - every row returned by /months (after migration: the last 12),
 *  - the current month + next month + month-after-next (so editors can plan ahead).
 *
 * Rows from the server win for status; auto-injected months get "not-built".
 */
function buildEntries(rows: MonthSummary[]): MonthSummary[] {
  const byKey = new Map<string, MonthSummary>();
  for (const r of rows) byKey.set(r.monthKey, r);

  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const n1 = nextMonth(cy, cm);
  const n2 = nextMonth(n1.year, n1.month);
  const future: Selection[] = [{ year: cy, month: cm }, n1, n2];
  for (const f of future) {
    const k = `${f.year}_${String(f.month).padStart(2, '0')}`;
    if (!byKey.has(k)) {
      byKey.set(k, {
        monthKey: k,
        year: f.year,
        month: f.month,
        draftUpdatedAt: null,
        publishedAt: null,
        draftVersion: 0,
        publishVersion: 0,
        status: 'not-built',
      });
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    (b.monthKey ?? '').localeCompare(a.monthKey ?? ''),
  );
}

function groupByYear(entries: MonthSummary[]) {
  const byYear = new Map<number, MonthSummary[]>();
  for (const e of entries) {
    if (!byYear.has(e.year)) byYear.set(e.year, []);
    byYear.get(e.year)!.push(e);
  }
  return Array.from(byYear.entries())
    .map(([year, list]) => ({
      year,
      months: list.sort((a, b) => b.month - a.month),
    }))
    .sort((a, b) => b.year - a.year);
}

export function MonthsSidebar({
  rows,
  selected,
  onSelect,
}: {
  rows: MonthSummary[];
  selected: Selection | null;
  onSelect: (s: Selection) => void;
}) {
  const entries = React.useMemo(() => buildEntries(rows), [rows]);
  const grouped = React.useMemo(() => groupByYear(entries), [entries]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        maxHeight: { md: 'calc(100vh - 220px)' },
        overflowY: 'auto',
      }}
    >
      {grouped.map(({ year, months }) => (
        <Box key={year}>
          <Typography
            variant="overline"
            sx={(t) => ({
              display: 'block',
              px: 2,
              py: 1,
              color: 'text.secondary',
              fontWeight: 700,
              letterSpacing: '0.04em',
              borderBottom: `1px solid ${t.palette.divider}`,
              backgroundColor: t.palette.background.paper,
              position: 'sticky',
              top: 0,
              zIndex: 1,
            })}
          >
            {year}
          </Typography>
          <List dense disablePadding>
            {months.map((m) => {
              const isSel =
                selected?.year === m.year && selected?.month === m.month;
              return (
                <ListItemButton
                  key={m.monthKey}
                  selected={isSel}
                  onClick={() => onSelect({ year: m.year, month: m.month })}
                  sx={(t) => ({
                    pl: 2,
                    gap: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(t.palette.primary.main, 0.10),
                    },
                  })}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: isSel ? 700 : 500 }}
                      noWrap
                    >
                      {MONTH_NAMES[m.month - 1]}
                    </Typography>
                    {statusChip(m.status)}
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Paper>
  );
}
