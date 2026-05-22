'use client';
import * as React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getEditorPassword } from '@/lib/auth/session';
import { Login } from './Login';

type Status = 'checking' | 'authed' | 'unauthed';

const AuthCtx = React.createContext<{ signOut: () => void } | null>(null);

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthGate.');
  return ctx;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>('checking');

  React.useEffect(() => {
    setStatus(getEditorPassword() ? 'authed' : 'unauthed');
    function onStorage(e: StorageEvent) {
      // If another tab signs out, follow suit.
      if (e.key === null || e.key === 'dz_editor_password') {
        setStatus(getEditorPassword() ? 'authed' : 'unauthed');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const ctx = React.useMemo(
    () => ({
      signOut: () => {
        try {
          window.sessionStorage.removeItem('dz_editor_password');
        } catch {
          /* noop */
        }
        setStatus('unauthed');
      },
    }),
    [],
  );

  if (status === 'checking') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthed') {
    return <Login onAuthed={() => setStatus('authed')} />;
  }

  return <AuthCtx.Provider value={ctx}>{children}</AuthCtx.Provider>;
}
