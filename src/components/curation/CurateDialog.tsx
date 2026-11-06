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
  IconButton,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useQueryClient } from '@tanstack/react-query';
import type { SpecialDay } from '@/lib/api/curation';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthIdMap } from '@/lib/manifest/types';
import { formatMonth } from '@/lib/date';
import { queryKeys } from '@/lib/queries/keys';
import {
  useCuration,
  useCurationCards,
  useCurationJob,
  useSpecialDays,
  useStartCuration,
} from '@/lib/queries/curation';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CurationProgress } from './CurationProgress';
import { CurationReview } from './CurationReview';
import { DEFAULT_COOLDOWNS, SpecialDaysStep, type BriefState } from './SpecialDaysStep';

type Step = 'brief' | 'generating' | 'review';
const STEP_INDEX: Record<Step, number> = { brief: 0, generating: 1, review: 2 };

/**
 * "Curate with AI": confirm the month's special days and brief, generate a
 * proposal on the curator Lambda (~3 min, ~$0.90), review it (swap, lock,
 * regenerate a day), then apply it to the editor's local draft. Nothing is
 * saved to the month until the editor clicks Save draft as usual.
 */
export function CurateDialog({
  open,
  year,
  month,
  currentIdMap,
  editorDirty,
  onApply,
  onClose,
}: {
  open: boolean;
  year: number;
  month: number;
  /** The editor's draft as it stands, used for "keep the filled slots". */
  currentIdMap: MonthIdMap;
  editorDirty: boolean;
  onApply: (ids: MonthIdMap, cardsById: ReadonlyMap<string, LibraryCard>) => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const curationQ = useCuration(year, month, open);
  const daysQ = useSpecialDays(year, month, open);
  const start = useStartCuration(year, month);

  const [step, setStep] = React.useState<Step>('brief');
  const [jobId, setJobId] = React.useState<string | null>(null);
  const jobQ = useCurationJob(step === 'generating' ? jobId : null);
  const [brief, setBrief] = React.useState<BriefState | null>(null);
  const [ids, setIds] = React.useState<MonthIdMap>({});
  const [confirmApply, setConfirmApply] = React.useState(false);
  const decided = React.useRef(false);

  const filledSlots = React.useMemo(
    () => Object.values(currentIdMap).reduce((n, row) => n + row.filter(Boolean).length, 0),
    [currentIdMap],
  );

  // Initialise the brief from the calendar and the last saved selection.
  React.useEffect(() => {
    if (!open || brief || !daysQ.data) return;
    const items = daysQ.data.items;
    setBrief({
      chosen: new Set(items.filter((d) => d.chosen && d.source !== 'custom').map((d) => d.id)),
      custom: items.filter((d) => d.chosen && d.source === 'custom'),
      brief: daysQ.data.brief ?? '',
      keepExisting: filledSlots > 0,
      ...DEFAULT_COOLDOWNS,
    });
  }, [open, brief, daysQ.data, filledSlots]);

  // On open: resume a running job, or offer the saved proposal.
  React.useEffect(() => {
    if (!open || decided.current || !curationQ.data) return;
    decided.current = true;
    if (curationQ.data.activeJob) {
      setJobId(curationQ.data.activeJob.jobId);
      setStep('generating');
    }
  }, [open, curationQ.data]);

  React.useEffect(() => {
    if (!open) decided.current = false;
  }, [open]);

  // The job finished: load the proposal and move to review.
  React.useEffect(() => {
    const job = jobQ.data;
    if (step !== 'generating' || !job || job.status !== 'done') return;
    qc.invalidateQueries({ queryKey: queryKeys.curation(year, month) }).then(() => setStep('review'));
  }, [jobQ.data, step, qc, year, month]);

  const curation = curationQ.data?.curation ?? null;
  const proposalKey = curation ? `${curation.jobId}|${curation.updatedAt}` : '';
  React.useEffect(() => {
    if (curation) setIds(curation.proposal.ids);
  }, [proposalKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const cardIds = React.useMemo(() => {
    if (!curation) return [] as string[];
    const p = curation.proposal;
    const all = new Set<string>();
    for (const row of Object.values(p.ids)) row.forEach((c) => c && all.add(c));
    for (const rows of Object.values(p.alternatives)) rows.forEach((r) => r.forEach((c) => c && all.add(c)));
    return Array.from(all);
  }, [curation]);
  const cardsQ = useCurationCards(cardIds, open && step === 'review');
  const cardsById = cardsQ.data ?? new Map<string, LibraryCard>();

  function generate() {
    if (!brief || !daysQ.data) return;
    const chosen: SpecialDay[] = [
      ...daysQ.data.items.filter((d) => brief.chosen.has(d.id) && d.source !== 'custom'),
      ...brief.custom,
    ].map((d) => {
      const { chosen, ...sd } = d; // the server ignores it; keep the request clean
      void chosen;
      return sd as SpecialDay;
    });
    start.mutate(
      {
        scope: 'month',
        specialDays: chosen,
        brief: brief.brief,
        locked: brief.keepExisting && filledSlots > 0 ? currentIdMap : undefined,
        settings: {
          cooldownTextDays: brief.cooldownTextDays,
          cooldownArticleDays: brief.cooldownArticleDays,
        },
      },
      {
        onSuccess: ({ jobId: id }) => {
          setJobId(id);
          setStep('generating');
        },
      },
    );
  }

  function apply() {
    onApply(ids, cardsById);
    setConfirmApply(false);
  }

  const cardsReady = cardsQ.isSuccess && !cardsQ.isPlaceholderData;
  const missingCards = step === 'review' && cardsReady
    ? Object.values(ids).flat().filter((c) => c && !cardsById.has(c)).length
    : 0;
  const job = jobQ.data;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth slotProps={{ paper: { sx: { height: '92vh' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeRoundedIcon color="primary" />
        <Box sx={{ flex: 1 }}>Curate {formatMonth(year, month)} with AI</Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={STEP_INDEX[step]}>
          <Step><StepLabel>Special days and brief</StepLabel></Step>
          <Step><StepLabel>Generate</StepLabel></Step>
          <Step><StepLabel>Review</StepLabel></Step>
        </Stepper>
      </Box>
      <DialogContent dividers>
        {step === 'brief' && (
          <>
            {curation && (
              <Alert
                severity="info"
                variant="outlined"
                sx={{ mb: 2 }}
                action={<Button size="small" onClick={() => setStep('review')}>Review it</Button>}
              >
                A proposal for this month was saved {curation.updatedAt ? new Date(curation.updatedAt).toLocaleString() : ''}.
                Review it for free, or generate a new one below.
              </Alert>
            )}
            {start.error && (
              <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
                {start.error.message}
              </Alert>
            )}
            {brief ? (
              <SpecialDaysStep
                year={year}
                month={month}
                items={(daysQ.data?.items ?? []).filter((d) => d.source !== 'custom')}
                loading={daysQ.isLoading}
                error={daysQ.error}
                value={brief}
                onChange={setBrief}
                filledSlots={filledSlots}
              />
            ) : daysQ.error ? (
              <Alert severity="error" variant="outlined">
                Couldn&apos;t load the special days: {daysQ.error.message}
              </Alert>
            ) : (
              <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
              </Box>
            )}
          </>
        )}
        {step === 'generating' && (
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <CurationProgress job={job} error={jobQ.error} />
          </Box>
        )}
        {step === 'review' && curation && (
          <>
            {missingCards > 0 && (
              <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
                {missingCards} card(s) in the proposal aren&apos;t in the library any more; those slots stay empty when applied.
              </Alert>
            )}
            <CurationReview
              year={year}
              month={month}
              curation={curation}
              ids={ids}
              onIdsChange={setIds}
              cardsById={cardsById}
              cardsLoading={cardsQ.isLoading || cardsQ.isPlaceholderData}
            />
          </>
        )}
        {step === 'review' && !curation && curationQ.isFetching && <Typography>Loading the proposal…</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        {step === 'brief' && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Takes about 3 minutes and about $0.90 on the Claude API. The proposal opens here for review; your month
              changes only when you apply it and save.
            </Typography>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeRoundedIcon />}
              onClick={generate}
              disabled={!brief || !daysQ.data || start.isPending}
            >
              {curation ? 'Generate a new proposal' : 'Generate'}
            </Button>
          </>
        )}
        {step === 'generating' && (
          <>
            <Box sx={{ flex: 1 }} />
            {job?.status === 'failed' && <Button onClick={() => setStep('brief')}>Back</Button>}
            <Button onClick={onClose}>{job?.status === 'failed' ? 'Close' : 'Hide (keeps running)'}</Button>
          </>
        )}
        {step === 'review' && (
          <>
            <Button onClick={() => setStep('brief')}>Start over</Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={onClose}>Close</Button>
            <Button
              variant="contained"
              onClick={() => (editorDirty || filledSlots > 0 ? setConfirmApply(true) : apply())}
              disabled={!curation || !cardsReady}
            >
              Apply to draft
            </Button>
          </>
        )}
      </DialogActions>
      <ConfirmDialog
        open={confirmApply}
        title="Replace the editor's draft?"
        body={
          editorDirty
            ? 'This replaces the month in the editor with the proposal, including your unsaved edits. Nothing is saved until you click Save draft.'
            : 'This replaces the month in the editor with the proposal. Nothing is saved until you click Save draft.'
        }
        confirmLabel="Apply"
        onConfirm={apply}
        onCancel={() => setConfirmApply(false)}
      />
    </Dialog>
  );
}
