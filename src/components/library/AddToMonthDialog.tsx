'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthIdMap } from '@/lib/manifest/types';
import { THEME_ORDER } from '@/lib/constants';
import { listMonthDates, nextMonth, prevMonth, formatMonth } from '@/lib/date';
import { manifestDateKey } from '@/lib/manifest/build';
import { useMonth, useSaveMonthDraft } from '@/lib/queries/months';
import { MonthPicker } from '@/components/build/MonthPicker';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

type DayState =
  /** Day has no row entry yet — clickable, will create the day with this one slot filled. */
  | { kind: 'new' }
  /** This card already occupies the theme slot. Disabled with checkmark. */
  | { kind: 'this-card' }
  /** Day exists but its theme slot is empty. Clickable, no confirm needed. */
  | { kind: 'empty-slot' }
  /** Day exists; theme slot is filled by another card. Clickable, triggers confirm. */
  | { kind: 'filled'; otherId: string };

/** Default: next calendar month. Editors usually plan ahead. */
function defaultMonth(): { year: number; month: number } {
  const now = new Date();
  return nextMonth(now.getFullYear(), now.getMonth() + 1);
}

export function AddToMonthDialog({
  open,
  card,
  onClose,
}: {
  open: boolean;
  card: LibraryCard | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const initial = React.useMemo(defaultMonth, []);
  const [year, setYear] = React.useState(initial.year);
  const [month, setMonth] = React.useState(initial.month);
  const [confirmReplace, setConfirmReplace] = React.useState<{
    date: string;
    otherId: string;
  } | null>(null);

  const monthQ = useMonth(year, month, open);
  const saveMut = useSaveMonthDraft(year, month);

  // Reset when the dialog is closed.
  //
  // `saveMut` intentionally NOT in deps — TanStack Query recreates the
  // mutation object reference on every render. Calling `saveMut.reset()`
  // notifies its subscribers (this very component), which produces a new
  // mutation ref, which would re-run the effect → infinite loop. Pin
  // the reset callback via a ref so the effect can fire only on `open`
  // transitions.
  const saveMutResetRef = React.useRef(saveMut.reset);
  saveMutResetRef.current = saveMut.reset;
  React.useEffect(() => {
    if (open) return;
    setConfirmReplace(null);
    saveMutResetRef.current();
  }, [open]);

  if (!card) return null;
  const safeCard = card; // narrow for closures below

  const themeIndex = THEME_ORDER.indexOf(safeCard.theme as (typeof THEME_ORDER)[number]);
  const isPublished = Boolean(monthQ.data?.publishedAt);
  const draft = monthQ.data?.draft ?? {};

  // Derive each day's state w.r.t. this card + theme.
  const dates = listMonthDates(year, month);
  const dayStates: Record<string, DayState> = {};
  for (const iso of dates) {
    const key = manifestDateKey(iso);
    const row = draft[key];
    if (!row) {
      dayStates[iso] = { kind: 'new' };
      continue;
    }
    const existing = row[themeIndex] || '';
    if (!existing) {
      dayStates[iso] = { kind: 'empty-slot' };
      continue;
    }
    if (existing === safeCard.cardId) {
      dayStates[iso] = { kind: 'this-card' };
    } else {
      dayStates[iso] = { kind: 'filled', otherId: existing };
    }
  }

  function performSave(iso: string) {
    if (!monthQ.data) return;
    const key = manifestDateKey(iso);
    const existingRow = draft[key];

    // For a brand-new day, the schema expects a length-6 array with
    // empty strings for the unset slots. The Lambda accepts this for
    // saves; Publish later refuses the month until every slot is filled.
    const newRow = existingRow
      ? existingRow.slice()
      : Array.from({ length: THEME_ORDER.length }, () => '');
    newRow[themeIndex] = safeCard.cardId;

    const newDraft: MonthIdMap = { ...draft, [key]: newRow };

    saveMut.mutate(
      { draft: newDraft, ifMatch: monthQ.data.draftVersion },
      {
        onSuccess: () => {
          onClose();
          router.push(`/months?ym=${year}_${String(month).padStart(2, '0')}`);
        },
      },
    );
  }

  function onChipClick(iso: string, state: DayState) {
    if (state.kind === 'this-card') return;
    if (state.kind === 'filled') {
      setConfirmReplace({ date: iso, otherId: state.otherId });
      return;
    }
    // 'new' or 'empty-slot' — write directly.
    performSave(iso);
  }

  function handleConfirmReplace() {
    if (!confirmReplace) return;
    performSave(confirmReplace.date);
    setConfirmReplace(null);
  }

  const error = monthQ.error ?? saveMut.error;
  const loading = monthQ.isLoading || (open && !monthQ.data);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add to month</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Pick a day in the selected month to schedule this card into its{' '}
              <strong>{safeCard.theme}</strong> slot. Days where the slot is
              already filled by a different card prompt to confirm before
              replacing.
            </Typography>

            <Stack direction="row" alignItems="center" justifyContent="center">
              <MonthPicker
                year={year}
                month={month}
                onChange={(y, m) => {
                  setYear(y);
                  setMonth(m);
                }}
              />
            </Stack>

            {isPublished && (
              <Alert severity="info" variant="outlined">
                {formatMonth(year, month)} is already published. Adding here writes
                an unsaved draft; the apps won&apos;t see the change until you publish
                + upload the JSON.
              </Alert>
            )}

            {loading ? (
              <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 1,
                }}
              >
                {dates.map((iso) => {
                  const day = Number(iso.slice(8, 10));
                  const state = dayStates[iso];
                  return (
                    <DayChip
                      key={iso}
                      day={day}
                      state={state}
                      onClick={() => onChipClick(iso, state)}
                    />
                  );
                })}
              </Box>
            )}

            {error && (
              <Alert severity="error" variant="outlined">
                {error instanceof Error ? error.message : 'Failed to save.'}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            onClick={() => router.push(`/months?ym=${year}_${String(month).padStart(2, '0')}`)}
            variant="text"
          >
            Open in Months →
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmReplace !== null}
        title="Replace existing card?"
        body={`That day's ${safeCard.theme} slot is currently filled by another card. Replace it with this one?`}
        confirmLabel="Replace"
        danger
        onCancel={() => setConfirmReplace(null)}
        onConfirm={handleConfirmReplace}
      />
    </>
  );
}

function DayChip({
  day,
  state,
  onClick,
}: {
  day: number;
  state: DayState;
  onClick: () => void;
}) {
  const tooltip =
    state.kind === 'new'
      ? 'Add this card and create the day with the rest of the slots empty.'
      : state.kind === 'empty-slot'
      ? "This day's slot is empty — add this card here."
      : state.kind === 'this-card'
      ? 'Already scheduled here.'
      : 'Replace the card currently in this slot.';

  const isInteractive = state.kind !== 'this-card';

  const chip = (
    <Chip
      label={
        state.kind === 'this-card' ? (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <CheckRoundedIcon sx={{ fontSize: 14 }} />
            <span>{day}</span>
          </Stack>
        ) : (
          String(day)
        )
      }
      onClick={isInteractive ? onClick : undefined}
      variant={state.kind === 'filled' ? 'filled' : 'outlined'}
      color={
        state.kind === 'this-card'
          ? 'success'
          : state.kind === 'filled'
          ? 'warning'
          : state.kind === 'empty-slot'
          ? 'primary'
          : 'default'
      }
      sx={(t) => ({
        width: '100%',
        cursor: isInteractive ? 'pointer' : 'default',
        fontWeight: 600,
        ...(state.kind === 'this-card' && {
          backgroundColor: alpha(t.palette.success.main, 0.08),
        }),
      })}
    />
  );

  return <Tooltip title={tooltip}>{chip}</Tooltip>;
}
