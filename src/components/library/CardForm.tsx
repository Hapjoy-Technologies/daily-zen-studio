'use client';
import * as React from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import type { LibraryCard } from '@/lib/api/types';
import type { EditableCardFields } from '@/lib/api/cards';
import {
  THEME_ORDER,
  THEME_LABELS,
  THEME_TITLES,
  THEME_DEFAULT_DZTYPE,
  THEME_DEFAULT_PRIMARY_CTA,
} from '@/lib/constants';

const STATUS_OPTIONS = ['active', 'retired'];

export type CardFormValues = EditableCardFields;

export function CardForm({
  initial,
  lockedTheme,
  submitting,
  submitLabel = 'Save',
  onSubmit,
  error,
}: {
  initial?: Partial<LibraryCard>;
  lockedTheme?: string;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: CardFormValues & { theme: string }) => void;
  error?: string | null;
}) {
  const startingTheme = lockedTheme ?? initial?.theme ?? 'Quote';
  const [theme, setTheme] = React.useState<string>(startingTheme);
  const [themeTitle, setThemeTitle] = React.useState<string>(
    initial?.themeTitle ?? THEME_TITLES[startingTheme] ?? '',
  );
  const [type, setType] = React.useState<string>(initial?.type ?? '');
  const [dzType, setDzType] = React.useState<string>(
    initial?.dzType ?? THEME_DEFAULT_DZTYPE[startingTheme] ?? 'share',
  );
  const [status, setStatus] = React.useState<string>(initial?.status ?? 'active');
  const [text, setText] = React.useState<string>(initial?.text ?? '');
  const [author, setAuthor] = React.useState<string>(initial?.author ?? '');
  const [articleUrl, setArticleUrl] = React.useState<string>(initial?.articleUrl ?? '');
  const [latestBgImageUrl, setLatestBgImageUrl] = React.useState<string>(
    initial?.latestBgImageUrl ?? 'https://static.gratefulness.me/daily-zen-bgimages/exp/dz_bg_1.jpg',
  );
  const [latestDzImageUrl, setLatestDzImageUrl] = React.useState<string>(initial?.latestDzImageUrl ?? '');
  const [primaryCTAText, setPrimaryCTAText] = React.useState<string>(
    initial?.primaryCTAText ?? THEME_DEFAULT_PRIMARY_CTA[startingTheme] ?? '',
  );
  const [sharePrefix, setSharePrefix] = React.useState<string>(initial?.sharePrefix ?? '');

  function handleThemeChange(next: string) {
    setTheme(next);
    // Helpful defaults for new cards; we don't overwrite if the editor already filled them.
    if (!themeTitle) setThemeTitle(THEME_TITLES[next] ?? '');
    if (!dzType) setDzType(THEME_DEFAULT_DZTYPE[next] ?? '');
    if (!primaryCTAText) setPrimaryCTAText(THEME_DEFAULT_PRIMARY_CTA[next] ?? '');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      theme,
      themeTitle: themeTitle || undefined,
      type: type || undefined,
      dzType: dzType || undefined,
      status,
      text: text || undefined,
      author: author || undefined,
      articleUrl: articleUrl || undefined,
      latestBgImageUrl,
      latestDzImageUrl,
      primaryCTAText: primaryCTAText || undefined,
      sharePrefix: sharePrefix || undefined,
    });
  }

  const needsArticleUrl = theme === 'Blog post' || theme === 'Gratitude stories';

  return (
    <Stack component="form" onSubmit={submit} spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField
          select
          label="Theme"
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          disabled={Boolean(lockedTheme)}
          fullWidth
        >
          {THEME_ORDER.map((t) => (
            <MenuItem key={t} value={t}>
              {THEME_LABELS[t]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Theme title"
          value={themeTitle}
          onChange={(e) => setThemeTitle(e.target.value)}
          fullWidth
          helperText="Shown above the card in the app"
        />
      </Stack>

      <TextField
        label="Text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        multiline
        minRows={3}
        helperText="May be empty for Blog / Story cards (article title is on the linked page)."
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} fullWidth />
        <TextField
          label="Article URL"
          value={articleUrl}
          onChange={(e) => setArticleUrl(e.target.value)}
          fullWidth
          required={needsArticleUrl}
          helperText={needsArticleUrl ? 'Required for Blog post / Gratitude story themes' : ''}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField
          label="dzType"
          value={dzType}
          onChange={(e) => setDzType(e.target.value)}
          fullWidth
          helperText="share | send | read"
        />
        <TextField label="type" value={type} onChange={(e) => setType(e.target.value)} fullWidth />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          fullWidth
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <TextField
        label="Background image URL"
        value={latestBgImageUrl}
        onChange={(e) => setLatestBgImageUrl(e.target.value)}
        helperText="e.g. https://static.gratefulness.me/daily-zen-bgimages/exp/dz_bg_1.jpg"
      />
      <TextField
        label="Foreground (dz) image URL"
        value={latestDzImageUrl}
        onChange={(e) => setLatestDzImageUrl(e.target.value)}
        helperText="e.g. https://static.gratefulness.me/daily-zen-bgimages/exp/quote_1234.png"
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
        <TextField
          label="Primary CTA text"
          value={primaryCTAText}
          onChange={(e) => setPrimaryCTAText(e.target.value)}
          fullWidth
        />
        <TextField
          label="Share prefix"
          value={sharePrefix}
          onChange={(e) => setSharePrefix(e.target.value)}
          fullWidth
        />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction="row" justifyContent="flex-end">
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
