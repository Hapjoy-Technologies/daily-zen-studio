'use client';
import * as React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { buildManifest, validateDraft } from '@/lib/manifest/build';
import { downloadManifest } from '@/lib/manifest/export';
import type { MonthDraft } from '@/lib/manifest/types';
import { listMonthDates } from '@/lib/date';
import { THEME_LABELS } from '@/lib/constants';

export function ExportButton({
  year,
  month,
  draft,
}: {
  year: number;
  month: number;
  draft: MonthDraft;
}) {
  const [dlg, setDlg] = React.useState<'closed' | 'block' | 'confirm-duplicates'>('closed');
  const [report, setReport] = React.useState<ReturnType<typeof validateDraft> | null>(null);

  function doExport() {
    const manifest = buildManifest(draft);
    downloadManifest(year, month, manifest);
    setDlg('closed');
  }

  function onClick() {
    const r = validateDraft(draft, listMonthDates(year, month));
    setReport(r);
    if (r.empties.length > 0) {
      setDlg('block');
    } else if (r.duplicates.length > 0) {
      setDlg('confirm-duplicates');
    } else {
      doExport();
    }
  }

  return (
    <>
      <Button onClick={onClick} variant="contained" startIcon={<DownloadIcon />}>
        Export month
      </Button>

      <Dialog open={dlg === 'block'} onClose={() => setDlg('closed')} maxWidth="sm" fullWidth>
        <DialogTitle>Some slots are empty</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Fill these {report?.empties.length} slot(s) before exporting</AlertTitle>
            The apps expect every day to have 6 cards in fixed order.
          </Alert>
          <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
            <List dense>
              {report?.empties.map((e) => (
                <ListItem key={`${e.date}-${e.theme}`} disableGutters>
                  <Typography variant="body2">
                    <code>{e.date}</code> — {THEME_LABELS[e.theme] ?? e.theme}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg('closed')}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dlg === 'confirm-duplicates'}
        onClose={() => setDlg('closed')}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Some cards are used more than once</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>{report?.duplicates.length} duplicate card(s) detected</AlertTitle>
            This is almost always unintentional. Confirm to export anyway.
          </Alert>
          <Stack spacing={1}>
            {report?.duplicates.map((d) => (
              <Box key={d.uniqueId}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {d.text || '(no text)'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  on {d.dates.join(', ')}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg('closed')}>Cancel</Button>
          <Button onClick={doExport} variant="contained">Export anyway</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
