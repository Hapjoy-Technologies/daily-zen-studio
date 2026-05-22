'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { setEditorPassword, clearEditorPassword } from '@/lib/auth/session';
import { probeLogin } from '@/lib/api/meta';
import { ApiError } from '@/lib/api/types';
import { getApiBase } from '@/lib/api/client';

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [pwd, setPwd] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const apiBase = getApiBase();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwd) return;
    setError(null);
    setLoading(true);
    setEditorPassword(pwd);
    try {
      await probeLogin();
      onAuthed();
    } catch (err) {
      clearEditorPassword();
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Wrong password.');
        else if (err.status === 0) setError(err.message);
        else setError(`Login probe failed (${err.status}): ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          borderRadius: '28px',
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Stack spacing={3} component="form" onSubmit={submit}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Daily Zen Studio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Internal tool. Enter the editor password to continue.
            </Typography>
          </Stack>

          {!apiBase && (
            <Alert severity="warning" variant="outlined">
              <code>NEXT_PUBLIC_API_BASE_URL</code> isn&apos;t set. Copy{' '}
              <code>.env.local.example</code> to <code>.env.local</code> and add the Lambda invoke URL.
            </Alert>
          )}

          <TextField
            label="Password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
            autoComplete="current-password"
            fullWidth
            disabled={loading}
          />

          {error && <Alert severity="error" variant="outlined">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !pwd}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? 'Checking…' : 'Sign in'}
          </Button>

          <Typography variant="caption" color="text.secondary">
            Your password is kept in <code>sessionStorage</code> and cleared when you close the tab.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
