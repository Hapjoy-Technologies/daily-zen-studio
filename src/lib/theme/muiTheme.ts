'use client';
import { alpha, createTheme, type Theme } from '@mui/material/styles';
import {
  lightRoles,
  darkRoles,
  m3Type,
  m3Shape,
  softShadow1,
  softShadow2,
  softShadow3,
  type M3ColorRoles,
} from './tokens';

type Mode = 'light' | 'dark';

function typographyVariant({
  size,
  line,
  weight,
  tight = false,
}: { size: number; line: number; weight: number; tight?: boolean }) {
  return {
    fontSize: `${size / 16}rem`,
    lineHeight: `${line / size}`,
    fontWeight: weight,
    fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
    letterSpacing: tight ? '-0.012em' : 0,
  };
}

export function buildMuiTheme(mode: Mode): Theme {
  const roles: M3ColorRoles = mode === 'light' ? lightRoles : darkRoles;
  const primary = roles.primary;
  const primaryContainer = roles.primaryContainer;
  const outlineVariant = roles.outlineVariant;

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: primary,
        contrastText: roles.onPrimary,
        light: primaryContainer,
        dark: roles.onPrimaryContainer,
      },
      secondary: {
        main: roles.secondary,
        contrastText: roles.onSecondary,
        light: roles.secondaryContainer,
        dark: roles.onSecondaryContainer,
      },
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
      divider: outlineVariant,
      action: {
        active: roles.onSurfaceVariant,
        hover: alpha(primary, 0.06),
        selected: alpha(primary, 0.10),
        focus: alpha(primary, 0.14),
      },
    },
    typography: {
      fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
      h1: typographyVariant({ ...m3Type.displayLarge, tight: true }),
      h2: typographyVariant({ ...m3Type.displayMedium, tight: true }),
      h3: typographyVariant({ ...m3Type.displaySmall, tight: true }),
      h4: typographyVariant({ ...m3Type.headlineLarge, tight: true }),
      h5: typographyVariant({ ...m3Type.headlineMedium, tight: true }),
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
            borderRadius: 999,
            paddingInline: 22,
            minHeight: 40,
            textTransform: 'none',
            fontWeight: 600,
            transition:
              'background-color 160ms ease, box-shadow 200ms ease, color 160ms ease, border-color 160ms ease',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': { boxShadow: `0 6px 18px -6px ${alpha(primary, 0.55)}` },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': { borderWidth: 1.5 },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: m3Shape.medium,
            transition: 'background-color 160ms ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 4,
            fontWeight: 600,
            height: 28,
          },
          outlined: { borderWidth: 1.5 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: m3Shape.large,
            backgroundColor: roles.surfaceContainerLow,
            border: `1px solid ${outlineVariant}`,
            boxShadow: softShadow1,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: {
            border: `1px solid ${outlineVariant}`,
            borderRadius: m3Shape.large,
            boxShadow: softShadow1,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'transparent' },
        styleOverrides: {
          root: {
            backgroundColor: alpha(roles.background, 0.72),
            backdropFilter: 'blur(14px) saturate(140%)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            color: roles.onSurface,
            borderBottom: 'none',
            boxShadow: softShadow1,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: m3Shape.extraLarge,
            border: `1px solid ${outlineVariant}`,
            boxShadow: softShadow3,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: roles.surfaceContainerLow,
            backgroundImage: 'none',
            boxShadow: softShadow2,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small', variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: m3Shape.medium,
            backgroundColor: alpha(roles.surface, 0.6),
            '& fieldset': { borderColor: outlineVariant },
            '&:hover fieldset': { borderColor: roles.outline },
            '&.Mui-focused fieldset': { borderWidth: 1.5 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: outlineVariant,
            paddingTop: 14,
            paddingBottom: 14,
          },
          head: {
            color: roles.onSurfaceVariant,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.02em',
            backgroundColor: roles.surfaceContainerLow,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 140ms ease',
            '&:hover': { backgroundColor: alpha(primary, 0.04) },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: m3Shape.medium,
            '&.Mui-selected': {
              backgroundColor: primaryContainer,
              color: roles.onPrimaryContainer,
              '&:hover': { backgroundColor: alpha(primary, 0.18) },
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 14,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: outlineVariant,
            '&.Mui-selected': {
              backgroundColor: primaryContainer,
              color: roles.onPrimaryContainer,
              '&:hover': { backgroundColor: alpha(primary, 0.18) },
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          grouped: {
            '&:not(:last-of-type)': { borderRadius: 999 },
            '&:not(:first-of-type)': { borderRadius: 999, marginLeft: 6, borderLeft: undefined },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: m3Shape.medium },
          outlinedWarning: { borderColor: outlineVariant },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: 12, paddingInline: 10, paddingBlock: 6 },
        },
      },
    },
  });
}

export const lightTheme = buildMuiTheme('light');
