'use client';
import * as React from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthDraft } from '@/lib/manifest/types';
import { listMonthDates, nextMonth } from '@/lib/date';
import { loadDraft, saveDraft, deleteDraft } from '@/lib/manifest/draftStore';
import { MonthPicker } from '@/components/build/MonthPicker';
import { MonthGrid } from '@/components/build/MonthGrid';
import { SlotPicker } from '@/components/build/SlotPicker';
import { ExportButton } from '@/components/build/ExportButton';
import { THEME_ORDER } from '@/lib/constants';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

function emptyDraft(year: number, month: number): MonthDraft {
  const days: MonthDraft['days'] = {};
  for (const d of listMonthDates(year, month)) days[d] = {};
  return { monthKey: `${year}-${String(month).padStart(2, '0')}`, days, updatedAt: new Date().toISOString() };
}

/** Default target: next calendar month from today. */
function defaultBuildMonth(): { year: number; month: number } {
  const now = new Date();
  return nextMonth(now.getFullYear(), now.getMonth() + 1);
}

export default function BuildPage() {
  const initial = React.useMemo(defaultBuildMonth, []);
  const [year, setYear] = React.useState(initial.year);
  const [month, setMonth] = React.useState(initial.month);
  const [draft, setDraft] = React.useState<MonthDraft>(() => emptyDraft(initial.year, initial.month));
  const [picker, setPicker] = React.useState<{ date: string; theme: string } | null>(null);
  const [confirmReset, setConfirmReset] = React.useState(false);

  // Load (or initialize) the draft whenever the target month changes.
  React.useEffect(() => {
    const existing = loadDraft(year, month);
    setDraft(existing ?? emptyDraft(year, month));
  }, [year, month]);

  // Auto-save the draft whenever it changes.
  React.useEffect(() => {
    saveDraft(year, month, draft);
  }, [draft, year, month]);

  const filledCount = React.useMemo(() => {
    let n = 0;
    for (const date of Object.keys(draft.days)) {
      for (const t of THEME_ORDER) if (draft.days[date]?.[t]) n++;
    }
    return n;
  }, [draft]);

  const totalSlots = listMonthDates(year, month).length * THEME_ORDER.length;

  function assignSlot(date: string, theme: string, card: LibraryCard) {
    setDraft((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [date]: { ...(prev.days[date] ?? {}), [theme]: card },
      },
      updatedAt: new Date().toISOString(),
    }));
    setPicker(null);
  }

  function clearSlot(date: string, theme: string) {
    setDraft((prev) => {
      const day = { ...(prev.days[date] ?? {}) };
      delete day[theme];
      return {
        ...prev,
        days: { ...prev.days, [date]: day },
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function resetMonth() {
    deleteDraft(year, month);
    setDraft(emptyDraft(year, month));
    setConfirmReset(false);
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} gap={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Build month</Typography>
          <Typography variant="body2" color="text.secondary">
            Defaults to next month. Draft auto-saves to this browser; export downloads a JSON manifest.
          </Typography>
        </Box>
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <Stack direction="row" gap={1}>
          <Button
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={() => setConfirmReset(true)}
          >
            Reset
          </Button>
          <ExportButton year={year} month={month} draft={draft} />
        </Stack>
      </Stack>

      <Alert severity="info" variant="outlined">
        Progress: <strong>{filledCount} / {totalSlots}</strong> slots filled
        {' · '}Last saved {new Date(draft.updatedAt).toLocaleString()}
      </Alert>

      <MonthGrid
        year={year}
        month={month}
        draft={draft}
        onSlotClick={(date, theme) => setPicker({ date, theme })}
        onSlotClear={clearSlot}
      />

      {picker && (
        <SlotPicker
          open={true}
          date={picker.date}
          theme={picker.theme}
          onClose={() => setPicker(null)}
          onAssign={(card) => assignSlot(picker.date, picker.theme, card)}
        />
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset this month?"
        body="Clears all draft assignments for this month from this browser. The library is untouched."
        confirmLabel="Reset"
        danger
        onConfirm={resetMonth}
        onCancel={() => setConfirmReset(false)}
      />
    </Stack>
  );
}
