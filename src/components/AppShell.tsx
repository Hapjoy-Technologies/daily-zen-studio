'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './AuthGate';

const NAV = [
  { href: '/library', label: 'Library', icon: <LibraryBooksIcon fontSize="small" /> },
  { href: '/build', label: 'Build month', icon: <CalendarMonthIcon fontSize="small" /> },
  { href: '/past', label: 'Past months', icon: <HistoryIcon fontSize="small" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 3, minHeight: 64 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
              }}
            >
              DZ
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Daily Zen Studio
            </Typography>
          </Stack>

          <Stack direction="row" gap={0.5} sx={{ ml: 2 }}>
            {NAV.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Button
                  key={n.href}
                  component={Link}
                  href={n.href}
                  startIcon={n.icon}
                  variant={active ? 'contained' : 'text'}
                  color={active ? 'primary' : 'inherit'}
                  size="small"
                >
                  {n.label}
                </Button>
              );
            })}
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Button
            color="inherit"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={signOut}
            size="small"
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
