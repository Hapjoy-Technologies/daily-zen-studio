'use client';
import * as React from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { THEME_ORDER, THEME_LABELS, RETIRED_THEMES } from '@/lib/constants';
import { useAuthors } from '@/lib/queries/meta';

export type SortKey = 'lru' | 'mru' | 'most' | 'alpha';
export const SORT_LABEL: Record<SortKey, string> = {
  lru: 'Least recently used',
  mru: 'Most recently used',
  most: 'Most used',
  alpha: 'Alphabetical (A → Z)',
};

export type LibraryFilterState = {
  theme: string | null;
  status: string;
  author: string | null;
  search: string;
  sort: SortKey;
  includeRetired: boolean;
};

export function LibraryFilters({
  state,
  onChange,
}: {
  state: LibraryFilterState;
  onChange: (next: LibraryFilterState) => void;
}) {
  const authors = useAuthors();

  return (
    <Stack spacing={2}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip
          key="all"
          label="All themes"
          color={state.theme === null ? 'primary' : 'default'}
          onClick={() => onChange({ ...state, theme: null })}
          variant={state.theme === null ? 'filled' : 'outlined'}
        />
        {THEME_ORDER.map((t) => (
          <Chip
            key={t}
            label={THEME_LABELS[t]}
            color={state.theme === t ? 'primary' : 'default'}
            variant={state.theme === t ? 'filled' : 'outlined'}
            onClick={() => onChange({ ...state, theme: state.theme === t ? null : t })}
          />
        ))}
        {state.includeRetired &&
          RETIRED_THEMES.map((t) => (
            <Chip
              key={t}
              label={THEME_LABELS[t]}
              variant={state.theme === t ? 'filled' : 'outlined'}
              color={state.theme === t ? 'primary' : 'default'}
              onClick={() => onChange({ ...state, theme: state.theme === t ? null : t })}
            />
          ))}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField
          label="Search text"
          placeholder="substring match"
          value={state.search}
          onChange={(e) => onChange({ ...state, search: e.target.value })}
          sx={{ flex: 1, minWidth: 240 }}
        />

        <Autocomplete
          options={authors.data ?? []}
          getOptionLabel={(o) => `${o.author} (${o.count})`}
          value={authors.data?.find((a) => a.author === state.author) ?? null}
          onChange={(_, v) => onChange({ ...state, author: v?.author ?? null })}
          loading={authors.isLoading}
          sx={{ minWidth: 240, flex: 1 }}
          renderInput={(p) => <TextField {...p} label="Author" />}
        />

        <TextField
          select
          label="Sort"
          value={state.sort}
          onChange={(e) => onChange({ ...state, sort: e.target.value as SortKey })}
          sx={{ minWidth: 220 }}
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <MenuItem key={k} value={k}>{SORT_LABEL[k]}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
        <Box>
          <ToggleButtonGroup
            size="small"
            value={state.status}
            exclusive
            onChange={(_, v) => v && onChange({ ...state, status: v })}
          >
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="">All statuses</ToggleButton>
            <ToggleButton value="retired">Retired</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Chip
          label={state.includeRetired ? 'Hide retired themes' : 'Show retired themes'}
          variant="outlined"
          onClick={() => onChange({ ...state, includeRetired: !state.includeRetired, theme: state.theme })}
        />
      </Stack>
    </Stack>
  );
}
