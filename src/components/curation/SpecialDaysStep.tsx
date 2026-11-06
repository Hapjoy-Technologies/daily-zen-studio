'use client';
import * as React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import type { SpecialDay } from '@/lib/api/curation';
import { daysInMonth, isoDate } from '@/lib/date';

export type BriefState = {
  chosen: Set<string>;
  custom: SpecialDay[];
  brief: string;
  keepExisting: boolean;
  cooldownTextDays: number;
  cooldownArticleDays: number;
};

export const DEFAULT_COOLDOWNS = { cooldownTextDays: 365, cooldownArticleDays: 120 };

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatRange(start: string, end: string): string {
  const fmt = (iso: string) => `${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
  if (start === end) return fmt(start);
  if (start.slice(0, 7) === end.slice(0, 7)) return `${fmt(start)}–${Number(end.slice(8, 10))}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function customDay(name: string, start: string, end: string, tone: string, major: boolean): SpecialDay {
  return {
    id: `custom-${start}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    name,
    start,
    end: end || start,
    weight: major ? 'major' : 'minor',
    occasions: [],
    topics: [],
    tone,
    sensitive: false,
    region: 'global',
    lead_days: 0,
    default_on: true,
    source: 'custom',
    note: '',
  };
}

export function SpecialDaysStep({
  year,
  month,
  items,
  loading,
  error,
  value,
  onChange,
  filledSlots,
}: {
  year: number;
  month: number;
  items: SpecialDay[];
  loading: boolean;
  error: Error | null;
  value: BriefState;
  onChange: (next: BriefState) => void;
  /** Slots already filled in the editor; offers "keep them" when > 0. */
  filledSlots: number;
}) {
  const first = isoDate(year, month, 1);
  const last = isoDate(year, month, daysInMonth(year, month));
  const [draft, setDraft] = React.useState({ name: '', start: first, end: '', tone: '', major: false });

  const toggle = (id: string) => {
    const chosen = new Set(value.chosen);
    if (chosen.has(id)) chosen.delete(id);
    else chosen.add(id);
    onChange({ ...value, chosen });
  };

  const addCustom = () => {
    if (!draft.name.trim() || !draft.start) return;
    const sd = customDay(draft.name.trim(), draft.start, draft.end, draft.tone.trim(), draft.major);
    if (value.custom.some((c) => c.id === sd.id)) return;
    onChange({ ...value, custom: [...value.custom, sd] });
    setDraft({ name: '', start: first, end: '', tone: '', major: false });
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Special days
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Ticked days shape the plan. Major days get their own cards on the day; minor ones are a light touch.
        </Typography>
        {loading && <CircularProgress size={20} />}
        {error && (
          <Alert severity="error" variant="outlined">
            Couldn&apos;t load the calendar: {error.message}
          </Alert>
        )}
        <Stack spacing={0.75}>
          {items.map((sd) => (
            <Paper
              key={sd.id}
              variant="outlined"
              sx={{ px: 1.5, py: 1, borderRadius: 2, opacity: value.chosen.has(sd.id) ? 1 : 0.7 }}
            >
              <Stack direction="row" alignItems="flex-start" gap={1}>
                <Checkbox
                  size="small"
                  checked={value.chosen.has(sd.id)}
                  onChange={() => toggle(sd.id)}
                  sx={{ p: 0.5, mt: -0.25 }}
                  inputProps={{ 'aria-label': `Use ${sd.name}` }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {sd.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatRange(sd.start, sd.end)}
                    </Typography>
                    <Chip
                      size="small"
                      label={sd.weight === 'major' ? 'Major' : 'Minor'}
                      color={sd.weight === 'major' ? 'primary' : 'default'}
                      variant={sd.weight === 'major' ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                    {sd.sensitive && (
                      <Chip size="small" label="Sensitive" color="warning" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                    )}
                    {sd.source === 'custom' && (
                      <Chip size="small" label="Custom" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                    )}
                  </Stack>
                  {sd.tone && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {sd.tone}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
          {value.custom.map((sd) => (
            <Paper key={sd.id} variant="outlined" sx={{ px: 1.5, py: 1, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {sd.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatRange(sd.start, sd.end)}
                    </Typography>
                    <Chip size="small" label="Custom" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                    <Chip size="small" label={sd.weight === 'major' ? 'Major' : 'Minor'} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                  </Stack>
                  {sd.tone && (
                    <Typography variant="caption" color="text.secondary">
                      {sd.tone}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  size="small"
                  aria-label={`Remove ${sd.name}`}
                  onClick={() => onChange({ ...value, custom: value.custom.filter((c) => c.id !== sd.id) })}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, borderStyle: 'dashed' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Add your own day
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1} sx={{ mt: 1 }} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              label="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              sx={{ flex: 2 }}
            />
            <TextField
              size="small"
              type="date"
              label="Date"
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: first, max: last } }}
            />
            <TextField
              size="small"
              type="date"
              label="Until (optional)"
              value={draft.end}
              onChange={(e) => setDraft({ ...draft, end: e.target.value })}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: draft.start || first, max: last } }}
            />
            <TextField
              size="small"
              label="Tone note (optional)"
              placeholder="e.g. Celebratory, thank our community"
              value={draft.tone}
              onChange={(e) => setDraft({ ...draft, tone: e.target.value })}
              sx={{ flex: 3 }}
            />
            <FormControlLabel
              control={<Switch size="small" checked={draft.major} onChange={(e) => setDraft({ ...draft, major: e.target.checked })} />}
              label={<Typography variant="caption">Major</Typography>}
            />
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={addCustom} disabled={!draft.name.trim()}>
              Add
            </Button>
          </Stack>
        </Paper>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Brief
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder="Optional. For example: lean into giving in week 1; keep Christmas Eve quiet and inclusive."
          value={value.brief}
          onChange={(e) => onChange({ ...value, brief: e.target.value.slice(0, 2000) })}
          helperText={`${value.brief.length}/2000 · The planner follows the brief over its defaults.`}
          sx={{ mt: 0.5 }}
        />
      </Box>

      {filledSlots > 0 && (
        <FormControlLabel
          control={
            <Switch checked={value.keepExisting} onChange={(e) => onChange({ ...value, keepExisting: e.target.checked })} />
          }
          label={
            <Typography variant="body2">
              Keep the {filledSlots} slot{filledSlots === 1 ? '' : 's'} already filled in this month and curate the rest
            </Typography>
          }
        />
      )}

      <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Reuse cooldowns
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {value.cooldownTextDays} days for text cards · {value.cooldownArticleDays} days for blog posts and stories
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              size="small"
              type="number"
              label="Quote, Spread, Think, Affirmation (days)"
              value={value.cooldownTextDays}
              onChange={(e) => onChange({ ...value, cooldownTextDays: Number(e.target.value) || 0 })}
              slotProps={{ htmlInput: { min: 30, max: 1095 } }}
              sx={{ width: 300 }}
            />
            <TextField
              size="small"
              type="number"
              label="Blog post, Story (days)"
              value={value.cooldownArticleDays}
              onChange={(e) => onChange({ ...value, cooldownArticleDays: Number(e.target.value) || 0 })}
              slotProps={{ htmlInput: { min: 0, max: 730 } }}
              sx={{ width: 220 }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            A card (or the same text or article) isn&apos;t reused until this long after it last ran. Shorter
            cooldowns widen the pool but readers may notice repeats.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
