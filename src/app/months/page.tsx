'use client';
import * as React from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useMonths } from '@/lib/queries/months';
import { MonthsSidebar } from '@/components/months/MonthsSidebar';
import { MonthEditor } from '@/components/months/MonthEditor';

type Selection = { year: number; month: number };

function defaultSelection(): Selection {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function MonthsPage() {
  const months = useMonths();
  const [selected, setSelected] = React.useState<Selection>(defaultSelection);

  // If the server has any rows, prefer the newest one over the default.
  // Only run once on first successful fetch.
  const adjusted = React.useRef(false);
  React.useEffect(() => {
    if (adjusted.current) return;
    if (months.data && months.data.length > 0) {
      const newest = months.data[0]; // server returns descending
      setSelected({ year: newest.year, month: newest.month });
      adjusted.current = true;
    }
  }, [months.data]);

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
