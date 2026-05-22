'use client';
import { createTheme, type Theme } from '@mui/material/styles';
import { lightRoles, darkRoles, m3Type, m3Shape, type M3ColorRoles } from './tokens';

type Mode = 'light' | 'dark';

function typographyVariant({ size, line, weight }: { size: number; line: number; weight: number }) {
  return {
    fontSize: `${size / 16}rem`,
    lineHeight: `${line / size}`,
    fontWeight: weight,
    fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
    letterSpacing: 0,
  };
}

export function buildMuiTheme(mode: Mode): Theme {
  const roles: M3ColorRoles = mode === 'light' ? lightRoles : darkRoles;

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: roles.primary,
        contrastText: roles.onPrimary,
        light: roles.primaryContainer,
        dark: roles.onPrimaryContainer,
      },
      secondary: {
        main: roles.secondary,
        contrastText: roles.onSecondary,
        light: roles.secondaryContainer,
        dark: roles.onSecondaryContainer,
      },
      // M3 "tertiary" — exposed via MUI's warning slot so chips/badges can use it.
      warning: {
        main: roles.tertiary,
        contrastText: roles.onTertiary,
        light: roles.tertiaryContainer,
        dark: roles.onTertiaryContainer,
      },
      error: {
        main: roles.error,
        contrastText: roles.onError,
        light: roles.errorContainer,
        dark: roles.onErrorContainer,
      },
      background: {
        default: roles.background,
        paper: roles.surface,
      },
      text: {
        primary: roles.onSurface,
        secondary: roles.onSurfaceVariant,
      },
      divider: roles.outlineVariant,
      action: {
        active: roles.onSurfaceVariant,
        hover: 'rgba(234, 67, 107, 0.08)',
        selected: 'rgba(234, 67, 107, 0.12)',
        focus: 'rgba(234, 67, 107, 0.16)',
      },
    },
    typography: {
      fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
      h1: typographyVariant(m3Type.displayLarge),
      h2: typographyVariant(m3Type.displayMedium),
      h3: typographyVariant(m3Type.displaySmall),
      h4: typographyVariant(m3Type.headlineLarge),
      h5: typographyVariant(m3Type.headlineMedium),
      h6: typographyVariant(m3Type.headlineSmall),
      subtitle1: typographyVariant(m3Type.titleLarge),
      subtitle2: typographyVariant(m3Type.titleMedium),
      body1: typographyVariant(m3Type.bodyLarge),
      body2: typographyVariant(m3Type.bodyMedium),
      button: { ...typographyVariant(m3Type.labelLarge), textTransform: 'none' as const },
      caption: typographyVariant(m3Type.bodySmall),
      overline: { ...typographyVariant(m3Type.labelSmall), textTransform: 'none' as const },
    },
    shape: { borderRadius: m3Shape.medium },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999, // M3 fully-rounded pill buttons
            paddingInline: 20,
            minHeight: 40,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: m3Shape.medium } },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: m3Shape.large,
            backgroundColor: roles.surfaceContainerLow,
            border: `1px solid ${roles.outlineVariant}`,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent' },
        styleOverrides: {
          root: {
            backgroundColor: roles.surface,
            color: roles.onSurface,
            borderBottom: `1px solid ${roles.outlineVariant}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: m3Shape.extraLarge } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: roles.surfaceContainerLow } },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: m3Shape.small },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
    },
  });
}

export const lightTheme = buildMuiTheme('light');
