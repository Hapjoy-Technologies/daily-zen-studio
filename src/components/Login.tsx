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
  alpha,
} from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
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
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={(t) => ({
          width: '100%',
          maxWidth: 480,
          p: { xs: 4, md: 5 },
          borderRadius: '32px',
          border: `1px solid ${t.palette.divider}`,
          backgroundColor: alpha(t.palette.background.paper, 0.85),
          backdropFilter: 'blur(14px) saturate(140%)',
          boxShadow:
            `0 30px 80px -32px ${alpha(t.palette.primary.main, 0.30)}, ` +
            `0 8px 24px -12px ${alpha(t.palette.primary.main, 0.18)}`,
        })}
      >
        <Stack spacing={3.5} component="form" onSubmit={submit}>
          <Stack spacing={2} alignItems="flex-start">
            <Box
              sx={(t) => ({
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background:
                  'linear-gradient(135deg, #FFE1E6 0%, #FFC2CC 60%, #FFB2BC 100%)',
                color: t.palette.primary.main,
                boxShadow:
                  `inset 0 -3px 6px ${alpha(t.palette.primary.main, 0.18)}, ` +
                  `0 6px 16px -6px ${alpha(t.palette.primary.main, 0.45)}`,
              })}
            >
              <FavoriteRoundedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Stack spacing={0.75}>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.018em' }}>
                Daily Zen Studio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Internal scheduling tool. Enter the shared editor password to continue.
              </Typography>
            </Stack>
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
            sx={{ py: 1.25 }}
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
