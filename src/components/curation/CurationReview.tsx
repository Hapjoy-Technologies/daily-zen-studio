'use client';
import * as React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useQueryClient } from '@tanstack/react-query';
import type { Curation, Proposal } from '@/lib/api/curation';
import type { LibraryCard } from '@/lib/api/types';
import type { MonthIdMap } from '@/lib/manifest/types';
import { THEME_LABELS, THEME_ORDER } from '@/lib/constants';
import { themeAccent } from '@/lib/theme/tokens';
import { dayOfWeek, listMonthDates } from '@/lib/date';
import { manifestDateKey } from '@/lib/manifest/build';
import { queryKeys } from '@/lib/queries/keys';
import { useCurationJob, useStartCuration } from '@/lib/queries/curation';
import { CardPreview } from '@/components/common/CardPreview';
import { SlotAlternatives, cardLabel, type AltReason } from './SlotAlternatives';
import { formatRange } from './SpecialDaysStep';

/** Curator theme keys, in THEME_ORDER (used by critic notes). */
const THEME_KEYS = ['quote', 'spread', 'think', 'blog', 'story', 'affn'] as const;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AUTHOR_GAP_DAYS = 7;

type Note = Proposal['warnings'][number];

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function CurationReview({
  year,
  month,
  curation,
  ids,
  onIdsChange,
  cardsById,
  cardsLoading,
}: {
  year: number;
  month: number;
  curation: Curation;
  /** The proposal as the editor has adjusted it (swaps), owned by the dialog. */
  ids: MonthIdMap;
  onIdsChange: (next: MonthIdMap) => void;
  cardsById: ReadonlyMap<string, LibraryCard>;
  cardsLoading: boolean;
}) {
  const p = curation.proposal;
  const qc = useQueryClient();
  const dates = React.useMemo(() => listMonthDates(year, month), [year, month]);
  const [locked, setLocked] = React.useState<Set<string>>(() => new Set());
  const [alts, setAlts] = React.useState<{ key: string; idx: number; anchor: HTMLElement } | null>(null);
  const [dayJob, setDayJob] = React.useState<{ jobId: string; date: string } | null>(null);
  const [dayError, setDayError] = React.useState<string | null>(null);
  const start = useStartCuration(year, month);
  const jobQ = useCurationJob(dayJob?.jobId ?? null);

  // A finished day job saved a new proposal: reload it (the dialog then resets `ids`).
  React.useEffect(() => {
    const job = jobQ.data;
    if (!dayJob || !job) return;
    if (job.status === 'done') {
      setDayJob(null);
      qc.invalidateQueries({ queryKey: queryKeys.curation(year, month) });
    } else if (job.status === 'failed') {
      setDayJob(null);
      setDayError(job.error ?? 'Regenerating the day failed.');
    }
  }, [jobQ.data, dayJob, qc, year, month]);

  const notesBySlot = React.useMemo(() => {
    const m = new Map<string, { applied: Note[]; warnings: Note[] }>();
    const add = (n: Note, kind: 'applied' | 'warnings') => {
      if (!n.date || !n.theme) return;
      const idx = THEME_KEYS.indexOf(n.theme as (typeof THEME_KEYS)[number]);
      if (idx < 0) return;
      const k = `${manifestDateKey(n.date)}:${idx}`;
      const e = m.get(k) ?? { applied: [], warnings: [] };
      e[kind].push(n);
      m.set(k, e);
    };
    p.applied.forEach((n) => add(n, 'applied'));
    p.warnings.forEach((n) => add(n, 'warnings'));
    return m;
  }, [p]);

  const generalNotes = p.warnings.filter((w) => !w.date || !w.theme);
  // Cards the final review took out of the month: never offer them back as alternatives.
  const removed = React.useMemo(
    () => new Set([...p.rejected, ...(p.applied.map((a) => a.from).filter(Boolean) as string[])]),
    [p],
  );
  const altsFor = (key: string, idx: number) =>
    (p.alternatives[key]?.[idx] ?? []).filter((a) => a !== ids[key]?.[idx] && !removed.has(a));
  const used = React.useMemo(() => new Set(Object.values(ids).flat().filter(Boolean)), [ids]);

  function blockedReason(key: string, idx: number) {
    const dayIndex = dates.indexOf(`${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`);
    return (cardId: string): AltReason => {
      if (used.has(cardId)) return 'used';
      const author = cardsById.get(cardId)?.author?.trim().toLowerCase();
      if (!author) return null;
      for (let d = Math.max(0, dayIndex - AUTHOR_GAP_DAYS + 1); d < Math.min(dates.length, dayIndex + AUTHOR_GAP_DAYS); d++) {
        const row = ids[manifestDateKey(dates[d])] ?? [];
        for (let i = 0; i < row.length; i++) {
          if (d === dayIndex && i === idx) continue;
          if (cardsById.get(row[i])?.author?.trim().toLowerCase() === author) return 'author';
        }
      }
      return null;
    };
  }

  function swap(key: string, idx: number, cardId: string) {
    const row = [...(ids[key] ?? Array(6).fill(''))];
    row[idx] = cardId;
    onIdsChange({ ...ids, [key]: row });
    setAlts(null);
  }

  function toggleLock(key: string, idx: number) {
    setLocked((prev) => {
      const next = new Set(prev);
      const k = `${key}:${idx}`;
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function regenerateDay(iso: string) {
    const key = manifestDateKey(iso);
    const keep: MonthIdMap = { ...ids };
    keep[key] = (ids[key] ?? Array(6).fill('')).map((c, i) => (locked.has(`${key}:${i}`) ? c : ''));
    setDayError(null);
    start.mutate(
      { scope: 'day', date: iso, locked: keep },
      {
        onSuccess: ({ jobId }) => setDayJob({ jobId, date: iso }),
        onError: (e) => setDayError(e instanceof Error ? e.message : 'Could not start the regenerate.'),
      },
    );
  }

  const s = p.stats as Record<string, unknown>;
  const filled = num(s.filled);
  const slots = num(s.slots);
  const hard = num(s.hardViolations);
  const avgQ = num(s.avgQuality);
  const fresh = num(s.medianDaysSinceLastUse);
  const authors = num(s.quoteAuthorDiversity);
  const busy = Boolean(dayJob) || start.isPending;

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 0.5 }}>
          <AutoAwesomeRoundedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {p.monthTheme || 'AI proposal'}
          </Typography>
        </Stack>
        {p.critic.summary && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {p.critic.summary}
          </Typography>
        )}
        <Stack direction="row" gap={1} flexWrap="wrap">
          {filled !== null && slots !== null && <Chip size="small" label={`${filled}/${slots} slots filled`} />}
          {hard !== null && (
            <Chip size="small" color={hard === 0 ? 'success' : 'error'} variant="outlined"
              label={hard === 0 ? 'No rule problems' : `${hard} rule problems`} />
          )}
          {avgQ !== null && <Chip size="small" variant="outlined" label={`Average quality ${avgQ.toFixed(1)} / 5`} />}
          {fresh !== null && <Chip size="small" variant="outlined" label={`Median ${fresh} days since last use`} />}
          {authors !== null && <Chip size="small" variant="outlined" label={`Quote authors ${Math.round(authors * 100)}% distinct`} />}
          <Chip size="small" variant="outlined" label={`Cost $${(p.totalCostUsd ?? p.costUsd).toFixed(2)}`} />
          {curation.updatedAt && (
            <Chip size="small" variant="outlined" label={`Saved ${new Date(curation.updatedAt).toLocaleString()}`} />
          )}
        </Stack>
        {p.weeks.length > 0 && (
          <Accordion disableGutters elevation={0} sx={{ mt: 1.5, '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, minHeight: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Weekly arcs, and {p.applied.length} swap{p.applied.length === 1 ? '' : 's'} the final review made
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                {p.weeks.map((w) => (
                  <Typography key={w.week} variant="body2">
                    <b>Week {w.week}</b> ({w.days}): {w.arc}
                  </Typography>
                ))}
              </Stack>
              <Stack spacing={0.5}>
                {p.applied.map((a, i) => (
                  <Typography key={i} variant="caption" color="text.secondary">
                    Swapped {a.date} {a.theme}: {a.problem}
                  </Typography>
                ))}
                {generalNotes.map((w, i) => (
                  <Typography key={`g${i}`} variant="caption" color="text.secondary">
                    Note: {w.problem}
                  </Typography>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>

      {dayError && (
        <Alert severity="error" variant="outlined" onClose={() => setDayError(null)}>
          {dayError}
        </Alert>
      )}
      {cardsLoading && (
        <Stack direction="row" gap={1} alignItems="center">
          <CircularProgress size={16} />
          <Typography variant="caption">Loading cards…</Typography>
        </Stack>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {dates.map((iso) => {
          const key = manifestDateKey(iso);
          const day = p.days[key];
          const intent = day?.intent;
          const row = ids[key] ?? Array(6).fill('');
          const dayNum = Number(iso.slice(8, 10));
          const specials = p.specialDays.filter((sd) => sd.start <= iso && iso <= sd.end);
          const running = dayJob?.date === iso;
          return (
            <Paper key={iso} variant="outlined" sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1, opacity: running ? 0.6 : 1 }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {dayNum}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {DOW[dayOfWeek(year, month, dayNum)]}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {intent?.tone && <Chip size="small" variant="outlined" label={intent.tone} sx={{ height: 20, fontSize: 11 }} />}
                <Tooltip title={busy ? 'Another regenerate is running.' : 'Regenerate this day: new cards for its unlocked slots (about 15 seconds, about $0.01). Locked slots stay.'}>
                  <span>
                    <IconButton size="small" onClick={() => regenerateDay(iso)} disabled={busy} aria-label={`Regenerate ${iso}`}>
                      {running ? <CircularProgress size={16} /> : <RefreshRoundedIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              {(specials.length > 0 || intent?.occasion) && (
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {specials.map((sd) => (
                    <Chip key={sd.id} size="small" color={sd.weight === 'major' ? 'primary' : 'default'}
                      label={`${sd.name}${sd.start !== sd.end ? ` · ${formatRange(sd.start, sd.end)}` : ''}`}
                      sx={{ height: 20, fontSize: 11 }} />
                  ))}
                </Stack>
              )}
              {intent && (
                <Tooltip title={intent.rationale || ''}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {intent.focus.join(' · ')}
                    {intent.rationale ? ` — ${intent.rationale}` : ''}
                  </Typography>
                </Tooltip>
              )}
              <Stack spacing={0.75}>
                {THEME_ORDER.map((theme, idx) => {
                  const cardId = row[idx] ?? '';
                  const card = cardId ? cardsById.get(cardId) ?? null : null;
                  const original = p.ids[key]?.[idx] ?? '';
                  const slot = day?.slots?.[idx];
                  const notes = notesBySlot.get(`${key}:${idx}`);
                  const isLocked = locked.has(`${key}:${idx}`);
                  const altList = altsFor(key, idx);
                  let why: string;
                  if (cardId !== original) why = 'You swapped this in.';
                  else if (notes?.applied.length) why = `Final review swap: ${notes.applied[0].problem}`;
                  else if (slot?.rank === 1 && slot.why) why = slot.why;
                  else if (slot?.rank) why = `The selector's choice #${slot.rank} for this slot.`;
                  else why = 'Chosen by the optimizer from the shortlist.';
                  return (
                    <ReviewSlot
                      key={theme}
                      theme={theme}
                      card={card}
                      why={why}
                      warning={notes?.warnings[0]?.problem}
                      locked={isLocked}
                      hasAlternatives={altList.length > 0}
                      onToggleLock={() => toggleLock(key, idx)}
                      onAlternatives={(el) => setAlts({ key, idx, anchor: el })}
                    />
                  );
                })}
              </Stack>
              {day?.note && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {day.note}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>

      {alts && (
        <SlotAlternatives
          anchorEl={alts.anchor}
          theme={THEME_ORDER[alts.idx]}
          date={`${alts.key.slice(0, 4)}-${alts.key.slice(4, 6)}-${alts.key.slice(6, 8)}`}
          alternatives={altsFor(alts.key, alts.idx)}
          cardsById={cardsById}
          blockedReason={blockedReason(alts.key, alts.idx)}
          onPick={(id) => swap(alts.key, alts.idx, id)}
          onClose={() => setAlts(null)}
        />
      )}
    </Stack>
  );
}

function ReviewSlot({
  theme,
  card,
  why,
  warning,
  locked,
  hasAlternatives,
  onToggleLock,
  onAlternatives,
}: {
  theme: string;
  card: LibraryCard | null;
  why: string;
  warning?: string;
  locked: boolean;
  hasAlternatives: boolean;
  onToggleLock: () => void;
  onAlternatives: (el: HTMLElement) => void;
}) {
  const accent = themeAccent[theme] ?? '#888';
  return (
    <Box
      sx={(t) => ({
        borderRadius: 2.5,
        border: `1px solid ${t.palette.divider}`,
        borderLeft: `4px solid ${accent}`,
        backgroundColor: locked ? alpha(accent, 0.06) : t.palette.background.paper,
        px: 1,
        py: 0.75,
      })}
    >
      <Stack direction="row" gap={1} alignItems="center">
        {card && <CardPreview card={card} size="xs" />}
        <Tooltip title={why} placement="top-start" enterDelay={400}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" gap={0.5} alignItems="center">
              <Typography variant="caption" sx={{ color: accent, fontWeight: 700, lineHeight: 1.2 }}>
                {THEME_LABELS[theme] ?? theme}
              </Typography>
              {warning && (
                <Tooltip title={`Review note: ${warning}`}>
                  <WarningAmberRoundedIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                </Tooltip>
              )}
            </Stack>
            <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {card ? cardLabel(card) : 'Card not loaded'}
            </Typography>
            {card?.author && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                — {card.author}
              </Typography>
            )}
          </Box>
        </Tooltip>
        <Stack>
          <Tooltip title={locked ? 'Locked: kept when you regenerate this day' : 'Lock to keep when regenerating this day'}>
            <IconButton size="small" onClick={onToggleLock} aria-label={locked ? 'Unlock slot' : 'Lock slot'} sx={{ p: 0.25 }}>
              {locked ? <LockRoundedIcon sx={{ fontSize: 16 }} color="primary" /> : <LockOpenRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={hasAlternatives ? 'Alternatives' : 'No alternatives saved'}>
            <span>
              <IconButton size="small" disabled={!hasAlternatives} onClick={(e) => onAlternatives(e.currentTarget)}
                aria-label="Show alternatives" sx={{ p: 0.25 }}>
                <SwapHorizRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
