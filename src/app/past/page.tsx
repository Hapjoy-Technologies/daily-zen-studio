'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAvailableManifests, type AvailableMonth } from '@/lib/queries/manifests';
import { manifestUrl } from '@/lib/api/manifests';
import { formatMonth } from '@/lib/date';
import { PastMonthView } from '@/components/past/PastMonthView';

export default function PastMonthsPage() {
  const { available, isLoading, errors } = useAvailableManifests();
  const [selected, setSelected] = React.useState<AvailableMonth | null>(null);

  // Auto-select the most-recent month once probes resolve.
  React.useEffect(() => {
    if (!selected && available.length > 0) setSelected(available[0]);
  }, [available, selected]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Past months</Typography>
          <Typography variant="body2" color="text.secondary">
            Loaded live from <code>static.gratefulness.me/gratitude-daily-zen/</code>. Read-only.
          </Typography>
        </Box>
        {isLoading && (
          <Stack direction="row" gap={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Probing months…
            </Typography>
          </Stack>
        )}
      </Stack>

      {errors.length > 0 && (
        <Alert severity="warning" variant="outlined">
          {errors.length} manifest probe(s) failed (likely a CORS or network issue).
          Available months are still shown below.
        </Alert>
      )}

      {!isLoading && available.length === 0 && (
        <Alert severity="info" variant="outlined">
          No published manifests were found at <code>{manifestUrl(2026, 1).replace('/2026/01/', '/<year>/<month>/')}</code>.
          Check CORS on the CDN bucket (Access-Control-Allow-Origin must include this site&apos;s origin).
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
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <List dense disablePadding>
            {available.map((m) => {
              const isSel = selected?.key === m.key;
              const dayCount = Object.keys(m.manifest).length;
              return (
                <ListItemButton
                  key={m.key}
                  selected={isSel}
                  onClick={() => setSelected(m)}
                >
                  <HistoryIcon
                    fontSize="small"
                    sx={{ mr: 1, color: isSel ? 'primary.main' : 'action.active' }}
                  />
                  <ListItemText
                    primary={formatMonth(m.year, m.month)}
                    secondary={`${dayCount} day${dayCount === 1 ? '' : 's'}`}
                    primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              );
            })}
            {available.length === 0 && !isLoading && (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">No months found.</Typography>
              </Box>
            )}
          </List>
        </Paper>

        <Box sx={{ minWidth: 0 }}>
          {selected ? (
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formatMonth(selected.year, selected.month)}
                </Typography>
                <Button
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  component="a"
                  href={manifestUrl(selected.year, selected.month)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View raw JSON
                </Button>
              </Stack>
              <PastMonthView
                year={selected.year}
                month={selected.month}
                manifest={selected.manifest}
              />
            </Stack>
          ) : (
            !isLoading && (
              <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
                Select a month from the list to view it.
              </Box>
            )
          )}
        </Box>
      </Box>
    </Stack>
  );
}
