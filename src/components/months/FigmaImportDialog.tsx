'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';

import { THEME_ORDER, THEME_LABELS, THEME_TITLES, THEME_DEFAULT_DZTYPE, THEME_DEFAULT_PRIMARY_CTA, type ThemeName } from '@/lib/constants';
import { daysInMonth, formatMonth } from '@/lib/date';
import { useMonths } from '@/lib/queries/months';
import { useSaveMonthDraft } from '@/lib/queries/months';
import { createCard, matchCards, updateCard, type EditableCardFields } from '@/lib/api/cards';
import type { LibraryCard } from '@/lib/api/types';
import {
  buildImportPlan,
  summarizePlan,
  type ImportPlan,
  type ImportSlot,
} from '@/lib/figma/importPlan';
import { parseStringsJson, type StringsJson } from '@/lib/figma/stringsJson';
import { THEME_SHARE_PREFIX, THEME_TYPE } from '@/lib/figma/defaults';
import type { MonthIdMap, MonthSummary } from '@/lib/manifest/types';
import { manifestDateKey } from '@/lib/manifest/build';
import { CardPreview } from '@/components/common/CardPreview';

type Decision =
  /** Reuse the matched library card as-is. */
  | { kind: 'reuse'; card: LibraryCard }
  /** Reuse the matched cardId, but PATCH the card with the imported fields
   *  (so e.g. image URLs for the new month replace the older ones). */
  | { kind: 'reuse-update'; card: LibraryCard }
  /** Create a brand-new card from the imported content. */
  | { kind: 'create' }
  /** Leave the slot empty (no extracted content or operator override). */
  | { kind: 'skip'; reason: 'no-content' | 'manual' };

type DialogStep =
  | 'input'
  | 'previewing' // running match query
  | 'preview'
  | 'applying'
  | 'done';

const CREATE_CONCURRENCY = 8;

/** Walk from the latest known indexed month up to `target`, summing daysInMonth. */
function suggestStartIndex(
  target: { year: number; month: number },
  months: MonthSummary[] | undefined,
): number | null {
  if (!months) return null;
  const candidates = months
    .filter((m) => typeof m.dzImageUrlStartIndex === 'number' && m.dzImageUrlStartIndex !== null)
    .filter(
      (m) =>
        m.year < target.year || (m.year === target.year && m.month < target.month),
    )
    .sort((a, b) => (b.year - a.year) || (b.month - a.month));
  const recent = candidates[0];
  if (!recent || recent.dzImageUrlStartIndex == null) return null;

  let total = recent.dzImageUrlStartIndex;
  let cy = recent.year;
  let cm = recent.month;
  while (cy < target.year || (cy === target.year && cm < target.month)) {
    total += daysInMonth(cy, cm);
    cm += 1;
    if (cm > 12) {
      cm = 1;
      cy += 1;
    }
  }
  return total;
}

async function inParallel<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function pump() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
    }
  }
  const lanes = Array.from({ length: Math.min(limit, items.length) }, () => pump());
  await Promise.all(lanes);
  return out;
}

export function FigmaImportDialog({
  open,
  year,
  month,
  onClose,
}: {
  open: boolean;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const months = useMonths();
  const saveDraftMut = useSaveMonthDraft(year, month);

  const suggested = React.useMemo(
    () => suggestStartIndex({ year, month }, months.data),
    [year, month, months.data],
  );

  const [step, setStep] = React.useState<DialogStep>('input');
  const [error, setError] = React.useState<string | null>(null);
  const [stringsRaw, setStringsRaw] = React.useState<StringsJson | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [startIndexInput, setStartIndexInput] = React.useState<string>('');
  const [plan, setPlan] = React.useState<ImportPlan | null>(null);
  const [decisions, setDecisions] = React.useState<Decision[]>([]);
  const [applyProgress, setApplyProgress] = React.useState<{
    created: number;
    toCreate: number;
  } | null>(null);

  // Seed start index from the suggestion once it's available (don't clobber edits).
  React.useEffect(() => {
    if (!open) return;
    if (startIndexInput) return;
    if (suggested != null) setStartIndexInput(String(suggested));
  }, [open, suggested, startIndexInput]);

  // Reset transient state when the dialog closes.
  //
  // `saveDraftMut` intentionally NOT in deps — its reference is recreated
  // on every render by TanStack Query, and combined with setters like
  // setDecisions([]) (new array each call) that would otherwise trigger
  // a re-render → new mutation ref → re-run effect → infinite loop.
  const saveDraftMutResetRef = React.useRef(saveDraftMut.reset);
  saveDraftMutResetRef.current = saveDraftMut.reset;
  React.useEffect(() => {
    if (open) return;
    setStep('input');
    setError(null);
    setStringsRaw(null);
    setFileName(null);
    setStartIndexInput('');
    setPlan(null);
    setDecisions([]);
    setApplyProgress(null);
    saveDraftMutResetRef.current();
  }, [open]);

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseStringsJson(text);
      setStringsRaw(parsed);
    } catch (e) {
      setStringsRaw(null);
      setError(e instanceof Error ? e.message : 'Could not parse strings.json');
    }
  }

  async function onBuildPreview() {
    setError(null);
    const startIndex = Number.parseInt(startIndexInput, 10);
    if (!stringsRaw) {
      setError('Upload a strings.json file first.');
      return;
    }
    if (!Number.isFinite(startIndex) || startIndex <= 0) {
      setError('Enter a valid dzImageUrlStartIndex (positive integer).');
      return;
    }
    const builtPlan = buildImportPlan({
      year,
      month,
      dzImageUrlStartIndex: startIndex,
      strings: stringsRaw,
    });

    setStep('previewing');
    try {
      // For each slot, ask /cards/match with the extracted text/articleUrl
      // (only when we actually extracted something).
      const matchInputs = builtPlan.slots.map((s) => {
        if (!s.extracted.ok) return null;
        const e: { theme: string; text?: string; articleUrl?: string } = {
          theme: s.theme,
        };
        if (s.extracted.text) e.text = s.extracted.text;
        if (s.extracted.articleUrl) e.articleUrl = s.extracted.articleUrl;
        return e;
      });
      // Compress the list (only entries that have content) to keep payload small,
      // then map the results back to slot indices.
      const filtered = matchInputs
        .map((e, i) => (e ? { entry: e, slotIdx: i } : null))
        .filter((x): x is { entry: { theme: string; text?: string; articleUrl?: string }; slotIdx: number } => x !== null);
      let matchResults: Array<LibraryCard | null> = [];
      if (filtered.length > 0) {
        matchResults = await matchCards(filtered.map((f) => f.entry));
      }

      const nextDecisions: Decision[] = builtPlan.slots.map((s, i) => {
        if (!s.extracted.ok) return { kind: 'skip', reason: 'no-content' };
        const filteredIdx = filtered.findIndex((f) => f.slotIdx === i);
        const hit = filteredIdx >= 0 ? matchResults[filteredIdx] : null;
        if (hit) {
          // Default to "reuse + update fields" — matched cards almost always
          // need their image URLs refreshed for the new month, and any text
          // edits in Figma should flow through. Editor can switch to plain
          // "Reuse as-is" per slot if they want to preserve the old fields.
          return { kind: 'reuse-update', card: hit };
        }
        return { kind: 'create' };
      });

      setPlan(builtPlan);
      setDecisions(nextDecisions);
      setStep('preview');
    } catch (e) {
      setStep('input');
      setError(e instanceof Error ? e.message : 'Failed to match against the library.');
    }
  }

  function updateDecision(slotIdx: number, value: string) {
    setDecisions((prev) => {
      const next = prev.slice();
      const slot = plan?.slots[slotIdx];
      if (!slot) return prev;
      const current = prev[slotIdx];
      const matchedCard =
        current.kind === 'reuse' || current.kind === 'reuse-update'
          ? current.card
          : null;

      if (value === 'create') {
        if (!slot.extracted.ok) return prev;
        next[slotIdx] = { kind: 'create' };
      } else if (value === 'skip') {
        next[slotIdx] = { kind: 'skip', reason: 'manual' };
      } else if (value === 'reuse') {
        if (matchedCard) next[slotIdx] = { kind: 'reuse', card: matchedCard };
      } else if (value === 'reuse-update') {
        if (matchedCard) next[slotIdx] = { kind: 'reuse-update', card: matchedCard };
      }
      return next;
    });
  }

  async function onApply() {
    if (!plan) return;
    setError(null);
    setStep('applying');

    // 1. Card writes — POST for "create" slots and PATCH for "reuse-update"
    //    slots. Run in parallel with a shared concurrency cap.
    const writeIdxs = decisions
      .map((d, i) => (d.kind === 'create' || d.kind === 'reuse-update' ? i : -1))
      .filter((i) => i >= 0);
    setApplyProgress({ created: 0, toCreate: writeIdxs.length });
    const newCardIds: Record<number, string> = {};
    try {
      await inParallel(writeIdxs, CREATE_CONCURRENCY, async (idx) => {
        const slot = plan.slots[idx];
        const decision = decisions[idx];
        if (!slot.extracted.ok) return undefined;
        if (decision.kind === 'create') {
          const body = buildCardCreateBody(slot);
          const created = await createCard(body);
          newCardIds[idx] = created.cardId;
        } else if (decision.kind === 'reuse-update') {
          const patch = buildCardUpdateBody(slot);
          if (Object.keys(patch).length > 0) {
            await updateCard(decision.card.cardId, patch);
          }
        }
        setApplyProgress((prev) =>
          prev ? { ...prev, created: prev.created + 1 } : prev,
        );
        return undefined;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Card write failed.');
      setStep('preview');
      return;
    }

    // 2. Build the IdMap from the decisions.
    const draftMap: MonthIdMap = {};
    plan.slots.forEach((slot, i) => {
      const decision = decisions[i];
      const dateKey = manifestDateKey(slot.date);
      let row = draftMap[dateKey];
      if (!row) {
        row = Array.from({ length: THEME_ORDER.length }, () => '');
        draftMap[dateKey] = row;
      }
      const themeIdx = THEME_ORDER.indexOf(slot.theme);
      if (decision.kind === 'reuse') row[themeIdx] = decision.card.cardId;
      else if (decision.kind === 'reuse-update') row[themeIdx] = decision.card.cardId;
      else if (decision.kind === 'create') row[themeIdx] = newCardIds[i] ?? '';
      // 'skip' leaves the slot as the empty placeholder.
    });

    // Drop any day rows that ended up entirely empty.
    for (const k of Object.keys(draftMap)) {
      if (draftMap[k].every((id) => !id)) delete draftMap[k];
    }

    // 3. Save the draft with the new start index.
    try {
      await saveDraftMut.mutateAsync({
        draft: draftMap,
        ifMatch: null, // overwrite any pending changes — the import is the source
        dzImageUrlStartIndex: plan.dzImageUrlStartIndex,
      });
      setStep('done');
      // Auto-close after a beat so the editor sees the populated grid.
      window.setTimeout(() => onClose(), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save the imported draft.');
      setStep('preview');
    }
  }

  const summary = plan ? summarizePlan(plan) : null;
  const decisionCounts = React.useMemo(() => {
    let reuse = 0;
    let reuseUpdate = 0;
    let create = 0;
    let skip = 0;
    for (const d of decisions) {
      if (d.kind === 'reuse') reuse++;
      else if (d.kind === 'reuse-update') reuseUpdate++;
      else if (d.kind === 'create') create++;
      else skip++;
    }
    return { reuse, reuseUpdate, create, skip };
  }, [decisions]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Import {formatMonth(year, month)} from Figma
      </DialogTitle>
      <DialogContent dividers>
        {step === 'input' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Upload the Figma{' '}
              <code>strings.json</code> export for this month. The Studio
              will dedupe against the library by exact text match; new
              cards get created as needed. Image PNG upload to S3 stays a
              separate manual step.
            </Typography>

            <Stack direction="row" gap={2} alignItems="center">
              <Button
                component="label"
                startIcon={<UploadFileRoundedIcon />}
                variant="outlined"
              >
                {fileName ? 'Replace file' : 'Choose strings.json'}
                <input
                  hidden
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
              </Button>
              {fileName && (
                <Typography variant="caption" color="text.secondary">
                  {fileName}
                </Typography>
              )}
            </Stack>

            <TextField
              label="dzImageUrlStartIndex"
              type="number"
              value={startIndexInput}
              onChange={(e) => setStartIndexInput(e.target.value)}
              helperText={
                suggested != null
                  ? `Auto-suggested ${suggested} from the most recent imported month. Override if needed.`
                  : 'No previous month with a stored start index — enter the value manually (e.g. 1813).'
              }
              sx={{ maxWidth: 320 }}
            />

            {error && (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            )}
          </Stack>
        )}

        {step === 'previewing' && (
          <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
            <Stack alignItems="center" gap={1}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Matching against the library…
              </Typography>
            </Stack>
          </Box>
        )}

        {step === 'preview' && plan && summary && (
          <Stack spacing={2}>
            <Alert severity="info" variant="outlined">
              <Typography variant="body2">
                <strong>{decisionCounts.reuse}</strong> reuse as-is ·{' '}
                <strong>{decisionCounts.reuseUpdate}</strong> reuse + update ·{' '}
                <strong>{decisionCounts.create}</strong> new ·{' '}
                <strong>{decisionCounts.skip}</strong> skipped.
              </Typography>
            </Alert>

            <TableContainer
              sx={(t) => ({
                border: `1px solid ${t.palette.divider}`,
                borderRadius: 2,
                maxHeight: '55vh',
              })}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 90 }}>Date</TableCell>
                    <TableCell sx={{ width: 140 }}>Theme</TableCell>
                    <TableCell sx={{ width: 110 }}>Figma id</TableCell>
                    <TableCell sx={{ width: 180 }}>Decision</TableCell>
                    <TableCell>Content</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.slots.map((slot, i) => (
                    <SlotRow
                      key={`${slot.date}-${slot.theme}`}
                      slot={slot}
                      decision={decisions[i]}
                      onChange={(v) => updateDecision(i, v)}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {error && (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            )}
          </Stack>
        )}

        {step === 'applying' && (
          <Stack spacing={2} sx={{ py: 4 }} alignItems="center">
            <Typography variant="body1">Applying import…</Typography>
            {applyProgress && (
              <Box sx={{ width: '100%', maxWidth: 360 }}>
                <Typography variant="caption" color="text.secondary">
                  Creating new cards: {applyProgress.created} /{' '}
                  {applyProgress.toCreate}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    applyProgress.toCreate === 0
                      ? 100
                      : (applyProgress.created / applyProgress.toCreate) * 100
                  }
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}
            {error && (
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            )}
          </Stack>
        )}

        {step === 'done' && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CheckCircleRoundedIcon
              color="success"
              sx={{ fontSize: 48, mb: 1 }}
            />
            <Typography variant="body1">Import complete.</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={step === 'applying'}>
          Close
        </Button>
        {step === 'input' && (
          <Button
            onClick={onBuildPreview}
            variant="contained"
            disabled={!stringsRaw}
          >
            Build preview
          </Button>
        )}
        {step === 'preview' && (
          <>
            <Button onClick={() => setStep('input')}>Back</Button>
            <Button onClick={onApply} variant="contained">
              Apply import
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function SlotRow({
  slot,
  decision,
  onChange,
}: {
  slot: ImportSlot;
  decision: Decision | undefined;
  onChange: (value: string) => void;
}) {
  const day = Number(slot.date.slice(8, 10));
  const empty = decision?.kind === 'skip' && decision.reason === 'no-content';
  const matchedCard =
    decision?.kind === 'reuse' || decision?.kind === 'reuse-update'
      ? decision.card
      : null;

  return (
    <TableRow
      sx={(t) => ({
        backgroundColor:
          decision?.kind === 'reuse'
            ? alpha(t.palette.success.main, 0.06)
            : decision?.kind === 'reuse-update'
            ? alpha(t.palette.warning.main, 0.08)
            : decision?.kind === 'create'
            ? alpha(t.palette.primary.main, 0.04)
            : empty
            ? alpha(t.palette.text.primary, 0.02)
            : 'transparent',
      })}
    >
      <TableCell>{day}</TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {THEME_LABELS[slot.theme] ?? slot.theme}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {slot.figmaId}
        </Typography>
      </TableCell>
      <TableCell>
        <TextField
          select
          size="small"
          value={
            decision?.kind === 'reuse'
              ? 'reuse'
              : decision?.kind === 'reuse-update'
              ? 'reuse-update'
              : decision?.kind === 'create'
              ? 'create'
              : 'skip'
          }
          onChange={(e) => onChange(e.target.value)}
          fullWidth
        >
          {matchedCard && (
            <MenuItem value="reuse">
              <Stack direction="row" alignItems="center" gap={0.75}>
                <CheckCircleRoundedIcon
                  fontSize="small"
                  color="success"
                  sx={{ fontSize: 16 }}
                />
                <span>Reuse as-is</span>
              </Stack>
            </MenuItem>
          )}
          {matchedCard && slot.extracted.ok && (
            <MenuItem value="reuse-update">
              <Stack direction="row" alignItems="center" gap={0.75}>
                <CheckCircleRoundedIcon
                  fontSize="small"
                  color="warning"
                  sx={{ fontSize: 16 }}
                />
                <span>Reuse + update fields</span>
              </Stack>
            </MenuItem>
          )}
          {slot.extracted.ok && (
            <MenuItem value="create">
              <Stack direction="row" alignItems="center" gap={0.75}>
                <AddCircleOutlineRoundedIcon
                  fontSize="small"
                  color="primary"
                  sx={{ fontSize: 16 }}
                />
                <span>Create new card</span>
              </Stack>
            </MenuItem>
          )}
          <MenuItem value="skip">
            <Stack direction="row" alignItems="center" gap={0.75}>
              <BlockRoundedIcon
                fontSize="small"
                sx={{ fontSize: 16, color: 'text.secondary' }}
              />
              <span>Skip slot</span>
            </Stack>
          </MenuItem>
        </TextField>
      </TableCell>
      <TableCell>
        <ContentCell slot={slot} decision={decision} />
      </TableCell>
    </TableRow>
  );
}

function ContentCell({
  slot,
  decision,
}: {
  slot: ImportSlot;
  decision: Decision | undefined;
}) {
  if (!slot.extracted.ok) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        (no strings.json entry — slot will stay empty)
      </Typography>
    );
  }
  const headline = slot.extracted.text || slot.extracted.articleUrl || '';
  const author = slot.extracted.author;
  const matchedCard =
    decision?.kind === 'reuse' || decision?.kind === 'reuse-update'
      ? decision.card
      : null;
  const isUpdate = decision?.kind === 'reuse-update';

  return (
    <Stack spacing={0.5}>
      <Stack spacing={0.25}>
        <Typography
          variant="body2"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-all',
          }}
        >
          {headline || '(no content)'}
        </Typography>
        {author && (
          <Typography variant="caption" color="text.secondary">
            — {author}
          </Typography>
        )}
      </Stack>

      {matchedCard && (
        <Stack
          direction="row"
          gap={1}
          alignItems="flex-start"
          sx={(t) => ({
            mt: 0.5,
            pt: 0.5,
            borderTop: `1px dashed ${t.palette.divider}`,
          })}
        >
          <CardPreview card={matchedCard} size="xs" />
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: isUpdate ? 'warning.dark' : 'success.dark',
              }}
            >
              {isUpdate
                ? `Updating ${matchedCard.cardId.slice(0, 6)}…`
                : `Reusing ${matchedCard.cardId.slice(0, 6)}…`}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-all',
              }}
            >
              {matchedCard.text ||
                matchedCard.articleUrl ||
                matchedCard.themeTitle}
            </Typography>
            {matchedCard.author && (
              <Typography variant="caption" color="text.secondary">
                — {matchedCard.author}
              </Typography>
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Build a PATCH body for the "reuse + update fields" flow. Only the
 * import-pipeline fields are included; we leave `firstUsedOn`,
 * `usageCount`, `usageHistory` etc. alone. Empties become `undefined` so
 * JSON.stringify drops them (DynamoDB rejects empty strings on GSI keys).
 */
function buildCardUpdateBody(slot: ImportSlot): EditableCardFields {
  if (!slot.extracted.ok) return {};
  const theme = slot.theme as ThemeName;
  const blank = (s: string | undefined | null) =>
    s && s.length > 0 ? s : undefined;
  const body: EditableCardFields = {};
  const set = <K extends keyof EditableCardFields>(
    k: K,
    v: EditableCardFields[K] | undefined,
  ) => {
    if (v !== undefined) body[k] = v;
  };
  set('themeTitle', blank(THEME_TITLES[theme]));
  set('type', blank(THEME_TYPE[theme]));
  set('dzType', blank(THEME_DEFAULT_DZTYPE[theme]));
  set('text', blank(slot.extracted.text));
  set('author', blank(slot.extracted.author));
  set('articleUrl', blank(slot.extracted.articleUrl));
  set('latestBgImageUrl', blank(slot.bgImageUrl));
  set('latestDzImageUrl', blank(slot.dzImageUrl));
  set('primaryCTAText', blank(THEME_DEFAULT_PRIMARY_CTA[theme]));
  set('sharePrefix', blank(THEME_SHARE_PREFIX[theme]));
  return body;
}

function buildCardCreateBody(slot: ImportSlot) {
  if (!slot.extracted.ok) {
    throw new Error('buildCardCreateBody called with no extracted content');
  }
  const theme = slot.theme as ThemeName;
  // DynamoDB rejects empty strings for GSI key attributes (author is on
  // ByAuthorRecency). Mirror the manual-create form's pattern: pass
  // `undefined` for fields that would otherwise be empty so JSON.stringify
  // drops them entirely and the Lambda's _filter_editable doesn't carry an
  // empty-string into PutItem.
  const blank = (s: string | undefined | null) => (s && s.length > 0 ? s : undefined);
  return {
    theme,
    themeTitle: blank(THEME_TITLES[theme]),
    type: blank(THEME_TYPE[theme]),
    dzType: blank(THEME_DEFAULT_DZTYPE[theme]),
    text: blank(slot.extracted.text),
    author: blank(slot.extracted.author),
    articleUrl: blank(slot.extracted.articleUrl),
    latestBgImageUrl: blank(slot.bgImageUrl),
    latestDzImageUrl: blank(slot.dzImageUrl),
    primaryCTAText: blank(THEME_DEFAULT_PRIMARY_CTA[theme]),
    sharePrefix: blank(THEME_SHARE_PREFIX[theme]),
  };
}
