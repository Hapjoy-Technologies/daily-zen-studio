/**
 * Material 3 color tokens lifted from the Gratitude Android app theme.
 * Light + dark variants are kept side-by-side; the MUI theme picks per-mode.
 */
export type M3ColorRoles = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  inversePrimary: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  outline: string;
  outlineVariant: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
};

export const lightRoles: M3ColorRoles = {
  primary: '#EA436B',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFD9DD',
  onPrimaryContainer: '#400012',
  inversePrimary: '#FFB2BC',

  secondary: '#76565A',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFD9DD',
  onSecondaryContainer: '#2C1518',

  tertiary: '#785831',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFDDB8',
  onTertiaryContainer: '#2A1800',

  background: '#FFFBFF',
  onBackground: '#201A1B',
  surface: '#FFF8F7',
  onSurface: '#201A1B',
  surfaceVariant: '#F2DDDF',
  onSurfaceVariant: '#524345',
  surfaceContainerLow: '#FEF1F1',
  surfaceContainer: '#F8EBEB',
  surfaceContainerHigh: '#F2E5E5',
  outline: '#847374',
  outlineVariant: '#D5C2C4',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
};

export const darkRoles: M3ColorRoles = {
  primary: '#FFB2BC',
  onPrimary: '#660024',
  primaryContainer: '#910034',
  onPrimaryContainer: '#FFD9DD',
  inversePrimary: '#B71849',

  secondary: '#E5BDC1',
  onSecondary: '#43292C',
  secondaryContainer: '#5C3F43',
  onSecondaryContainer: '#FFD9DD',

  tertiary: '#EABF8F',
  onTertiary: '#442B07',
  tertiaryContainer: '#5E411C',
  onTertiaryContainer: '#FFDDB8',

  background: '#201A1B',
  onBackground: '#ECE0E0',
  surface: '#181212',
  onSurface: '#ECE0E0',
  surfaceVariant: '#524345',
  onSurfaceVariant: '#D5C2C4',
  surfaceContainerLow: '#201A1B',
  surfaceContainer: '#241D1E',
  surfaceContainerHigh: '#2F2829',
  outline: '#9E8C8D',
  outlineVariant: '#524345',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
};

/** Material 3 type scale. Sizes in px (line in px), weights as numeric. */
export const m3Type = {
  displayLarge: { size: 57, line: 64, weight: 600 },
  displayMedium: { size: 45, line: 52, weight: 600 },
  displaySmall: { size: 36, line: 44, weight: 600 },
  headlineLarge: { size: 32, line: 40, weight: 600 },
  headlineMedium: { size: 28, line: 36, weight: 600 },
  headlineSmall: { size: 24, line: 32, weight: 600 },
  titleLarge: { size: 22, line: 28, weight: 600 },
  titleMedium: { size: 16, line: 24, weight: 600 },
  titleSmall: { size: 14, line: 20, weight: 600 },
  bodyLarge: { size: 16, line: 24, weight: 400 },
  bodyMedium: { size: 14, line: 20, weight: 400 },
  bodySmall: { size: 12, line: 16, weight: 400 },
  labelLarge: { size: 14, line: 20, weight: 600 },
  labelMedium: { size: 12, line: 16, weight: 600 },
  labelSmall: { size: 11, line: 16, weight: 600 },
} as const;

/** M3 shape scale (radii in px). */
export const m3Shape = {
  small: 4,
  medium: 12,
  large: 16,
  extraLarge: 28,
} as const;

/** A modest color hint per theme — used by ThemeChip on the library / build pages. */
export const themeAccent: Record<string, string> = {
  Quote: '#EA436B',
  'Spread Gratitude': '#76565A',
  'Think this instead of that': '#785831',
  'Blog post': '#5B6BA1',
  'Gratitude stories': '#5E8A6F',
  Affn: '#B85C9C',
  'Dose of Motivation': '#8E8E8E',
};
