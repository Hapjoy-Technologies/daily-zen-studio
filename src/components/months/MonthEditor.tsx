'use client';
import * as React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PublishRoundedIcon from '@mui/icons-material/PublishRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';

import type { LibraryCard } from '@/lib/api/types';
import type { MonthDraft, MonthIdMap } from '@/lib/manifest/types';
import { THEME_ORDER, THEME_LABELS } from '@/lib/constants';
import { listMonthDates, formatMonth } from '@/lib/date';
import {
  buildResolvedManifest,
  idMapToMonthDraft,
  monthDraftToIdMap,
  manifestDateKey,
} from '@/lib/manifest/build';
import { downloadManifest } from '@/lib/manifest/export';
import {
  useCardsLookup,
  useDiscardMonthDraft,
  useMonth,
  usePublishMonth,
  useSaveMonthDraft,
} from '@/lib/queries/months';
import { MonthGrid } from '@/components/build/MonthGrid';
import { SlotPicker } from '@/components/build/SlotPicker';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const STATUS_LABEL = {
  published: 'Published',
  'draft-changes': 'Draft changes pending',
  'unpublished-draft': 'Unpublished draft',
  'not-built': 'Not built yet',
} as const;

function emptyDraft(year: number, month: number): MonthDraft {
  const days: MonthDraft['days'] = {};
  for (const d of listMonthDates(year, month)) days[d] = {};
  return {
    monthKey: `${year}-${String(month).padStart(2, '0')}`,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/** Build a fully-padded MonthDraft from a server IdMap. */
function hydrateDraft(
  year: number,
  month: number,
  idMap: MonthIdMap,
  cardsById: ReadonlyMap<string, LibraryCard>,
): MonthDraft {
  const base = emptyDraft(year, month);
  const resolved = idMapToMonthDraft(year, month, idMap, cardsById);
  for (const date of Object.keys(resolved.days)) {
    base.days[date] = resolved.days[date];
  }
  return base;
}

function idMapsEqual(a: MonthIdMap, b: MonthIdMap): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    if (ak[i] !== bk[i]) return false;
    const va = a[ak[i]];
    const vb = b[bk[i]];
    if (va.length !== vb.length) return false;
    for (let j = 0; j < va.length; j++) if (va[j] !== vb[j]) return false;
  }
  return true;
}

export function MonthEditor({ year, month }: { year: number; month: number }) {
  const monthQ = useMonth(year, month);
  const row = monthQ.data;

  // Union of every ID referenced anywhere in the row — drives the bulk lookup.
  const allIds = React.useMemo(() => {
    if (!row) return [] as string[];
    const set = new Set<string>();
    for (const ids of Object.values(row.draft ?? {})) ids.forEach((id) => set.add(id));
    for (const ids of Object.values(row.published ?? {})) ids.forEach((id) => set.add(id));
    return Array.from(set);
  }, [row]);

  const lookupQ = useCardsLookup(allIds, allIds.length > 0);
  const cardsById = React.useMemo(
    () => lookupQ.data?.cardsById ?? new Map<string, LibraryCard>(),
    [lookupQ.data],
  );

  // Editor state — the in-memory MonthDraft the UI mutates. Initialized once
  // from the server row + resolved cards. Subsequent server pushes (Save /
  // Publish responses) don't overwrite it; the editor explicitly resets via
  // `resetFromServer` after Discard.
  const [localDraft, setLocalDraft] = React.useState<MonthDraft | null>(null);
  const [baseVersion, setBaseVersion] = React.useState<number>(0);
  const [picker, setPicker] = React.useState<{ date: string; theme: string } | null>(null);
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [conflictOpen, setConflictOpen] = React.useState(false);

  const monthKey = row?.monthKey;
  const ready =
    Boolean(row) && (allIds.length === 0 || lookupQ.isSuccess);

  // First-time init when row + lookups are ready, or when the parent
  // switches months (key prop in parent triggers remount; ref handles
  // re-init within the same instance just in case).
  const initedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!row || !ready) return;
    if (initedFor.current === row.monthKey) return;
    setLocalDraft(hydrateDraft(year, month, row.draft, cardsById));
    setBaseVersion(row.draftVersion);
    initedFor.current = row.monthKey;
  }, [row, cardsById, year, month, ready]);

  function resetFromServer() {
    if (!row) return;
    setLocalDraft(hydrateDraft(year, month, row.draft, cardsById));
    setBaseVersion(row.draftVersion);
  }

  // Mutations.
  const saveMut = useSaveMonthDraft(year, month);
  const publishMut = usePublishMonth(year, month);
  const discardMut = useDiscardMonthDraft(year, month);

  function assignSlot(date: string, theme: string, card: LibraryCard) {
    setLocalDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: {
          ...prev.days,
          [date]: { ...(prev.days[date] ?? {}), [theme]: card },
        },
        updatedAt: new Date().toISOString(),
      };
    });
    setPicker(null);
  }

  function clearSlot(date: string, theme: string) {
    setLocalDraft((prev) => {
      if (!prev) return prev;
      const day = { ...(prev.days[date] ?? {}) };
      delete day[theme];
      return {
        ...prev,
        days: { ...prev.days, [date]: day },
        updatedAt: new Date().toISOString(),
      };
    });
  }

  // Derived state.
  const localIdMap = React.useMemo(
    () => (localDraft ? monthDraftToIdMap(localDraft) : {}),
    [localDraft],
  );
  const dirty = React.useMemo(() => {
    if (!row || !localDraft) return false;
    return !idMapsEqual(localIdMap, row.draft);
  }, [localIdMap, row, localDraft]);

  const filledDays = React.useMemo(() => Object.keys(localIdMap).length, [localIdMap]);
  const partialDays = React.useMemo(() => {
    if (!localDraft) return [] as string[];
    const out: string[] = [];
    for (const [date, slots] of Object.entries(localDraft.days)) {
      const count = THEME_ORDER.filter((t) => slots?.[t]).length;
      if (count > 0 && count < THEME_ORDER.length) out.push(date);
    }
    return out;
  }, [localDraft]);
  const emptyDays = React.useMemo(() => {
    if (!localDraft) return [] as string[];
    return Object.keys(localDraft.days).filter(
      (d) => THEME_ORDER.filter((t) => localDraft.days[d]?.[t]).length === 0,
    );
  }, [localDraft]);

  const canSave = dirty && partialDays.length === 0 && !saveMut.isPending;
  const draftEqualsPublished = row?.published && idMapsEqual(localIdMap, row.published);
  const canPublish =
    Boolean(row) &&
    Object.keys(localIdMap).length === listMonthDates(year, month).length &&
    partialDays.length === 0 &&
    !dirty && // must Save first
    !draftEqualsPublished &&
    !publishMut.isPending;

  // ---------- actions ----------
  function onSave() {
    if (!canSave) return;
    saveMut.mutate(
      { draft: localIdMap, ifMatch: baseVersion },
      {
        onSuccess: (r) => setBaseVersion(r.draftVersion),
        onError: (e: Error & { status?: number }) => {
          if (e.status === 409) setConflictOpen(true);
        },
      },
    );
  }

  function buildAndDownload(idMap: MonthIdMap, fileLabel: string) {
    const { manifest, missing } = buildResolvedManifest(idMap, cardsById);
    if (missing.length > 0) {
      // Shouldn't happen if we gate publish on `missing.length === 0`, but guard.
      // eslint-disable-next-line no-alert
      alert(`Cannot ${fileLabel}: ${missing.length} cards are missing from the library.`);
      return false;
    }
    downloadManifest(year, month, manifest);
    return true;
  }

  function onPublishConfirmed() {
    if (!row) return;
    // Build manifest first so the editor can still recover if Publish fails.
    if (!buildAndDownload(localIdMap, 'publish')) return;
    publishMut.mutate(undefined, {
      onSuccess: () => setPublishOpen(false),
    });
  }

  function onRedownload() {
    if (!row?.published) return;
    buildAndDownload(row.published, 'download');
  }

  function onDiscardConfirmed() {
    discardMut.mutate(undefined, {
      onSuccess: () => {
        resetFromServer();
        setDiscardOpen(false);
      },
    });
  }

  // ---------- render ----------
  const loading = monthQ.isLoading || lookupQ.isLoading;
  const error = monthQ.error ?? lookupQ.error ?? saveMut.error ?? publishMut.error ?? discardMut.error;

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatMonth(year, month)}
          </Typography>
          {row && (
            <Chip
              size="small"
              variant="outlined"
              color={
                row.status === 'published'
                  ? 'success'
                  : row.status === 'draft-changes'
                  ? 'warning'
                  : row.status === 'unpublished-draft'
                  ? 'info'
                  : 'default'
              }
              label={STATUS_LABEL[row.status]}
              sx={{ fontWeight: 600 }}
            />
          )}
          {dirty && (
            <Chip
              size="small"
              variant="filled"
              color="warning"
              label="Unsaved local changes"
              sx={{ fontWeight: 600 }}
            />
          )}
          {(loading || saveMut.isPending || publishMut.isPending || discardMut.isPending) && (
            <CircularProgress size={18} />
          )}
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap">
          <Tooltip
            title={
              !dirty
                ? 'No changes to save.'
                : partialDays.length > 0
                ? 'Each edited day must have all 6 slots filled (or none).'
                : ''
            }
          >
            <span>
              <Button
                onClick={onSave}
                disabled={!canSave}
                startIcon={<SaveRoundedIcon />}
                variant="outlined"
              >
                Save draft
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              dirty
                ? 'Save your draft first.'
                : emptyDays.length > 0
                ? `${emptyDays.length} day(s) still empty.`
                : draftEqualsPublished
                ? 'Draft already matches the published version.'
                : ''
            }
          >
            <span>
              <Button
                onClick={() => setPublishOpen(true)}
                disabled={!canPublish}
                startIcon={<PublishRoundedIcon />}
                variant="contained"
              >
                Publish
              </Button>
            </span>
          </Tooltip>
          {row?.published && (
            <Tooltip title="Download the JSON for the currently published version.">
              <Button
                onClick={onRedownload}
                startIcon={<DownloadRoundedIcon />}
                variant="text"
              >
                Re-download
              </Button>
            </Tooltip>
          )}
          {row?.published && dirty && (
            <Tooltip title="Revert your draft back to the published version.">
              <Button
                onClick={() => setDiscardOpen(true)}
                startIcon={<UndoRoundedIcon />}
                color="inherit"
              >
                Discard
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" gap={2} flexWrap="wrap" sx={{ color: 'text.secondary' }}>
        <Typography variant="caption">
          {filledDays} / {listMonthDates(year, month).length} days fully scheduled
        </Typography>
        {row?.draftUpdatedAt && (
          <Typography variant="caption">
            Last saved {new Date(row.draftUpdatedAt).toLocaleString()}
          </Typography>
        )}
        {row?.publishedAt && (
          <Typography variant="caption">
            Last published {new Date(row.publishedAt).toLocaleString()}
          </Typography>
        )}
      </Stack>

      {lookupQ.data?.missing && lookupQ.data.missing.length > 0 && (
        <Alert severity="warning" variant="outlined">
          <AlertTitle>
            {lookupQ.data.missing.length} referenced card(s) are missing from the library
          </AlertTitle>
          Fix the affected slots before publishing.
        </Alert>
      )}

      {error && (
        <Alert severity="error" variant="outlined">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </Alert>
      )}

      {ready && localDraft ? (
        <MonthGrid
          year={year}
          month={month}
          draft={localDraft}
          onSlotClick={(date, theme) => setPicker({ date, theme })}
          onSlotClear={clearSlot}
        />
      ) : (
        <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {picker && (
        <SlotPicker
          open={true}
          date={picker.date}
          theme={picker.theme}
          onClose={() => setPicker(null)}
          onAssign={(card) => assignSlot(picker.date, picker.theme, card)}
        />
      )}

      <Dialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Publish {formatMonth(year, month)}?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Marks the current draft as published in the database and downloads{' '}
            <code>
              {year}_{String(month).padStart(2, '0')}.json
            </code>
            . Upload that file to{' '}
            <code>s3://gratitude-daily-zen/monthly/</code> so the apps see the
            change.
          </DialogContentText>
          {lookupQ.data?.missing && lookupQ.data.missing.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }} variant="outlined">
              <AlertTitle>Missing cards block publish</AlertTitle>
              <List dense disablePadding>
                {lookupQ.data.missing.slice(0, 10).map((id) => (
                  <ListItem key={id} disableGutters sx={{ py: 0 }}>
                    <code>{id}</code>
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
          <Button
            onClick={onPublishConfirmed}
            variant="contained"
            disabled={
              publishMut.isPending ||
              (lookupQ.data?.missing && lookupQ.data.missing.length > 0)
            }
          >
            Publish + download
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        title="Discard draft changes?"
        body="Reverts the draft back to the currently-published version. Your unsaved local edits will also be lost."
        confirmLabel="Discard"
        danger
        onConfirm={onDiscardConfirmed}
        onCancel={() => setDiscardOpen(false)}
      />

      <Dialog open={conflictOpen} onClose={() => setConflictOpen(false)}>
        <DialogTitle>Draft version conflict</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Someone else saved this month while you were editing. Reload to
            pick up their changes — your local edits will be discarded.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setConflictOpen(false);
              monthQ.refetch().then(() => {
                resetFromServer();
              });
            }}
            variant="contained"
          >
            Reload
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ visibility: 'hidden' }} />
    </Stack>
  );
}
