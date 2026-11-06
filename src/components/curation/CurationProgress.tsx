'use client';
import * as React from 'react';
import { Alert, AlertTitle, Box, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import type { CurationJob } from '@/lib/api/curation';

/** The month pipeline's stages, as the job row reports them (see curator/pipeline.py). */
const STAGES: Array<{ key: string; label: string; from: number }> = [
  { key: 'loading', label: 'Loading the card library', from: 0 },
  { key: 'eligibility', label: 'Checking which cards can be reused', from: 10 },
  { key: 'planning', label: 'Planning the month (about 2 minutes)', from: 15 },
  { key: 'shortlisting', label: 'Shortlisting cards for every slot', from: 35 },
  { key: 'selecting', label: 'Choosing cards week by week', from: 40 },
  { key: 'optimizing', label: 'Fitting the month together', from: 75 },
  { key: 'checking images', label: 'Checking every image', from: 80 },
  { key: 'reviewing', label: 'Final review', from: 85 },
  { key: 'saving', label: 'Saving the proposal', from: 95 },
];

function elapsed(since?: string): string {
  if (!since) return '';
  const s = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

export function CurationProgress({ job, error }: { job: CurationJob | undefined; error: Error | null }) {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (error) {
    return (
      <Alert severity="error" variant="outlined">
        Couldn&apos;t read the job: {error.message}
      </Alert>
    );
  }
  if (job?.status === 'failed') {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>Curation failed{job.failedStage ? ` while ${job.failedStage}` : ''}</AlertTitle>
        {job.error}
        {typeof job.costUsd === 'number' && job.costUsd > 0 && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            API cost so far: ${job.costUsd.toFixed(2)}
          </Typography>
        )}
      </Alert>
    );
  }

  const pct = job?.progress ?? 0;
  const stage = job?.stage ?? 'queued';
  const week = /selecting \((\d+)\/(\d+) weeks\)/.exec(stage);
  return (
    <Stack spacing={2.5} sx={{ py: 2 }}>
      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {job?.status === 'queued' || !job ? 'Starting…' : `${pct}%`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {elapsed(job?.createdAt)} · usually about 3 minutes · you can close this window, it keeps running
          </Typography>
        </Stack>
        <LinearProgress variant={job ? 'determinate' : 'indeterminate'} value={pct} sx={{ height: 8, borderRadius: 4 }} />
      </Box>
      <Stack spacing={1}>
        {STAGES.map((s, i) => {
          const next = STAGES[i + 1]?.from ?? 101;
          const done = pct >= next || job?.status === 'done';
          const active = !done && pct >= s.from && job?.status === 'running';
          const label = s.key === 'selecting' && week && active ? `Choosing cards: week ${week[1]} of ${week[2]} done` : s.label;
          return (
            <Stack key={s.key} direction="row" gap={1.25} alignItems="center" sx={{ opacity: done || active ? 1 : 0.5 }}>
              {done ? (
                <CheckCircleRoundedIcon color="success" fontSize="small" />
              ) : active ? (
                <AutorenewRoundedIcon
                  color="primary"
                  fontSize="small"
                  sx={{ animation: 'dz-spin 1.4s linear infinite', '@keyframes dz-spin': { to: { transform: 'rotate(360deg)' } } }}
                />
              ) : (
                <RadioButtonUncheckedRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>
                {label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
