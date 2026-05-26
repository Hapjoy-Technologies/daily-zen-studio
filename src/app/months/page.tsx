'use client';
import * as React from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useMonths } from '@/lib/queries/months';
import { MonthsSidebar } from '@/components/months/MonthsSidebar';
import { MonthEditor } from '@/components/months/MonthEditor';

type Selection = { year: number; month: number };

const YM_RE = /^(\d{4})_(\d{2})$/;

function defaultSelection(): Selection {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function parseYm(value: string | null): Selection | null {
  if (!value) return null;
  const match = YM_RE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (Number.isNaN(year) || Number.isNaN(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * Read `?ym=YYYY_MM` from the current URL on mount. We use window.location
 * directly instead of useSearchParams so static export doesn't need a
 * <Suspense> wrapper around the whole page.
 */
function readYmFromLocation(): Selection | null {
  if (typeof window === 'undefined') return null;
  const ym = new URLSearchParams(window.location.search).get('ym');
  return parseYm(ym);
}

export default function MonthsPage() {
  const months = useMonths();
  const [selected, setSelected] = React.useState<Selection>(defaultSelection);
  const [didApplyDeepLink, setDidApplyDeepLink] = React.useState(false);

  // ?ym=YYYY_MM deep-links — used by the Library's "Add to month" shortcut.
  // Read once on mount; we don't keep the URL in sync as the user clicks
  // around the sidebar.
  React.useEffect(() => {
    const fromUrl = readYmFromLocation();
    if (fromUrl) {
      setSelected(fromUrl);
      setDidApplyDeepLink(true);
    }
  }, []);

  // If the user didn't deep-link and the server has rows, prefer the newest.
  const adjusted = React.useRef(false);
  React.useEffect(() => {
    if (adjusted.current || didApplyDeepLink) return;
    if (months.data && months.data.length > 0) {
      const newest = months.data[0]; // server returns descending
      setSelected({ year: newest.year, month: newest.month });
      adjusted.current = true;
    }
  }, [months.data, didApplyDeepLink]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Months
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Build, edit, and re-publish any month. Save updates the internal
          draft; Publish snapshots it and downloads the JSON for upload to{' '}
          <code>s3://gratitude-daily-zen/monthly/</code>.
        </Typography>
      </Box>

      {months.error && (
        <Alert severity="error" variant="outlined">
          {months.error instanceof Error
            ? months.error.message
            : 'Failed to load months.'}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' },
          gap: 3,
          alignItems: 'flex-start',
        }}
      >
        {months.isLoading && !months.data ? (
          <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <MonthsSidebar
            rows={months.data ?? []}
            selected={selected}
            onSelect={setSelected}
          />
        )}

        <Box sx={{ minWidth: 0 }}>
          <MonthEditor
            // remount when the user switches months so the editor's local
            // state hydrates cleanly from the new row.
            key={`${selected.year}-${selected.month}`}
            year={selected.year}
            month={selected.month}
          />
        </Box>
      </Box>
    </Stack>
  );
}
