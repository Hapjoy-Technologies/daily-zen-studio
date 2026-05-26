'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from './AuthGate';

const NAV = [
  { href: '/library', label: 'Library', icon: <LibraryBooksRoundedIcon fontSize="small" /> },
  { href: '/months', label: 'Months', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2, minHeight: { xs: 64, md: 72 } }}>
          <Stack direction="row" alignItems="center" gap={1.25} component={Link} href="/library"
            sx={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background:
                  'linear-gradient(135deg, #FFE1E6 0%, #FFC2CC 60%, #FFB2BC 100%)',
                color: 'primary.main',
                boxShadow: (t) =>
                  `inset 0 -2px 4px ${alpha(t.palette.primary.main, 0.18)}, 0 2px 8px -2px ${alpha(t.palette.primary.main, 0.35)}`,
              }}
            >
              <FavoriteRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}
            >
              Daily Zen Studio
            </Typography>
          </Stack>

          <Stack direction="row" gap={0.5} sx={{ ml: { xs: 1, md: 3 } }}>
            {NAV.map((n) => {
              const active = pathname?.startsWith(n.href) ?? false;
              return (
                <Button
                  key={n.href}
                  component={Link}
                  href={n.href}
                  startIcon={n.icon}
                  size="small"
                  disableElevation
                  sx={(t) => ({
                    color: active ? t.palette.primary.dark : t.palette.text.secondary,
                    bgcolor: active ? t.palette.primary.light : 'transparent',
                    fontWeight: active ? 700 : 500,
                    '&:hover': {
                      bgcolor: active
                        ? alpha(t.palette.primary.main, 0.18)
                        : alpha(t.palette.primary.main, 0.06),
                    },
                  })}
                >
                  {n.label}
                </Button>
              );
            })}
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Sign out">
            <IconButton onClick={signOut} aria-label="Sign out">
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          px: { xs: 2, md: 4, xl: 6 },
          py: { xs: 3, md: 4 },
          maxWidth: 1440,
          mx: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
