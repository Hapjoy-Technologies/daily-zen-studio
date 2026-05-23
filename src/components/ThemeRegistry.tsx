'use client';
import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { lightTheme } from '@/lib/theme/muiTheme';

const bodyBackground =
  'radial-gradient(at 0% 0%, #FFEEF2 0%, transparent 40%),' +
  'radial-gradient(at 100% 0%, #FFE9F0 0%, transparent 35%),' +
  'radial-gradient(at 50% 100%, #FBF3F5 0%, transparent 50%),' +
  '#FFF7F8';

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            'html, body': {
              minHeight: '100%',
            },
            body: {
              background: bodyBackground,
              backgroundAttachment: 'fixed',
            },
            // Subtle scrollbar to match the pastel canvas.
            '*::-webkit-scrollbar': { width: 10, height: 10 },
            '*::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(217, 183, 189, 0.6)',
              borderRadius: 999,
            },
            '*::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(217, 183, 189, 0.85)',
            },
          }}
        />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
