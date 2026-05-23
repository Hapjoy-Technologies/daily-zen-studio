'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { usePastManifest } from '@/lib/queries/manifests';
import { listCandidateMonths, manifestUrl } from '@/lib/api/manifests';
import { formatMonth, prevMonth } from '@/lib/date';
import { PastMonthView } from '@/components/past/PastMonthView';

type Selection = { year: number; month: number };

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Group candidate months by year, both ordered descending. */
function groupByYear(months: Selection[]) {
  const byYear = new Map<number, Selection[]>();
  for (const m of months) {
    if (!byYear.has(m.year)) byYear.set(m.year, []);
    byYear.get(m.year)!.push(m);
  }
  return Array.from(byYear.entries())
    .map(([year, list]) => ({
      year,
      months: [...list].sort((a, b) => b.month - a.month),
    }))
    .sort((a, b) => b.year - a.year);
}

/** Default selection: last calendar month (almost always the latest published). */
function defaultSelection(): Selection {
  const now = new Date();
  return prevMonth(now.getFullYear(), now.getMonth() + 1);
}

export default function PastMonthsPage() {
  const candidates = React.useMemo(() => listCandidateMonths(), []);
  const grouped = React.useMemo(() => groupByYear(candidates), [candidates]);

  const [selected, setSelected] = React.useState<Selection>(defaultSelection);
  const query = usePastManifest(selected.year, selected.month);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Past months</Typography>
        <Typography variant="body2" color="text.secondary">
          Loaded live from <code>static.gratefulness.me/gratitude-daily-zen/</code>. Click a month
          in the list to fetch it — nothing is loaded until you ask for it.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '240px minmax(0, 1fr)' },
          gap: 3,
          alignItems: 'flex-start',
        }}
      >
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
                  const isSel = selected.year === m.year && selected.month === m.month;
                  return (
                    <ListItemButton
                      key={`${m.year}-${m.month}`}
                      selected={isSel}
                      onClick={() => setSelected(m)}
                      sx={{ pl: 2 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: isSel ? 700 : 500 }}
                      >
                        {MONTH_NAMES[m.month - 1]}
                      </Typography>
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Paper>

        <Box sx={{ minWidth: 0 }}>
          <DetailPane
            selection={selected}
            isLoading={query.isPending || query.isFetching}
            manifest={query.data ?? null}
            error={query.error}
          />
        </Box>
      </Box>
    </Stack>
  );
}

function DetailPane({
  selection,
  isLoading,
  manifest,
  error,
}: {
  selection: Selection;
  isLoading: boolean;
  manifest: Awaited<ReturnType<typeof usePastManifest>>['data'] | null;
  error: Error | null;
}) {
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatMonth(selection.year, selection.month)}
          </Typography>
          {isLoading && <CircularProgress size={18} />}
        </Stack>
        <Button
          size="small"
          startIcon={<OpenInNewIcon />}
          component="a"
          href={manifestUrl(selection.year, selection.month)}
          target="_blank"
          rel="noreferrer"
        >
          View raw JSON
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" variant="outlined">
          {error instanceof Error ? error.message : 'Failed to load this manifest.'}
        </Alert>
      )}

      {!isLoading && !error && manifest === null && (
        <Alert severity="info" variant="outlined">
          No manifest published at this URL yet. If you&apos;ve just exported{' '}
          {formatMonth(selection.year, selection.month)}, make sure it&apos;s been uploaded to the
          CDN; otherwise pick a different month from the list.
        </Alert>
      )}

      {manifest && (
        <PastMonthView
          year={selection.year}
          month={selection.month}
          manifest={manifest}
        />
      )}
    </Stack>
  );
}
