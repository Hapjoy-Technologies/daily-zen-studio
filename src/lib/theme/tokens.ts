/**
 * Material 3 color tokens — cream + vivid pink accent direction.
 *
 * The Gratitude Android app uses a saturated rose pink (#EA436B) on near-white
 * surfaces. On the web that reads as a utility admin tool. This palette keeps
 * the brand pink but pastels the surrounding canvas: warm cream backgrounds,
 * very soft pink containers, muted pink-grey outlines, warm coral tertiary.
 * The vivid #EA436B stays for CTAs, active states, and chips so the brand
 * still anchors the page.
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
  primaryContainer: '#FFE1E6',
  onPrimaryContainer: '#3B0010',
  inversePrimary: '#FFB2BC',

  secondary: '#8A6770',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFE1E6',
  onSecondaryContainer: '#2E141A',

  tertiary: '#C97A4F',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD9C2',
  onTertiaryContainer: '#3A1A05',

  background: '#FFF7F8',
  onBackground: '#241317',
  surface: '#FFFCFC',
  onSurface: '#241317',
  surfaceVariant: '#F7E4E7',
  onSurfaceVariant: '#5A464A',
  surfaceContainerLow: '#FCEFF1',
  surfaceContainer: '#F8E3E7',
  surfaceContainerHigh: '#F3D6DC',
  outline: '#D9B7BD',
  outlineVariant: '#F0DCDF',

  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
};

export const darkRoles: M3ColorRoles = {
  primary: '#FFB2BC',
  onPrimary: '#660024',
  primaryContainer: '#910034',
  onPrimaryContainer: '#FFE1E6',
  inversePrimary: '#B71849',

  secondary: '#E5BDC1',
  onSecondary: '#43292C',
  secondaryContainer: '#5C3F43',
  onSecondaryContainer: '#FFE1E6',

  tertiary: '#FFB68B',
  onTertiary: '#5A2A0B',
  tertiaryContainer: '#7A3F17',
  onTertiaryContainer: '#FFD9C2',

  background: '#1B1314',
  onBackground: '#ECE0E0',
  surface: '#1B1314',
  onSurface: '#ECE0E0',
  surfaceVariant: '#524345',
  onSurfaceVariant: '#D5C2C4',
  surfaceContainerLow: '#221A1B',
  surfaceContainer: '#261E1F',
  surfaceContainerHigh: '#312828',
  outline: '#9E8C8D',
  outlineVariant: '#524345',

  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
};

/**
 * Soft pink-tinted shadows for Paper, Card, Dialog, AppBar.
 * Tuned to be barely-there on the cream background — the goal is depth
 * without darkening the warm tone of the canvas.
 */
export const softShadow1 =
  '0 1px 2px rgba(46, 16, 24, 0.04), 0 4px 12px -6px rgba(234, 67, 107, 0.10)';
export const softShadow2 =
  '0 1px 2px rgba(46, 16, 24, 0.05), 0 8px 24px -8px rgba(234, 67, 107, 0.14)';
export const softShadow3 =
  '0 4px 8px rgba(46, 16, 24, 0.06), 0 20px 48px -16px rgba(234, 67, 107, 0.20)';

/** Material 3 type scale. Sizes in px (line in px), weights as numeric. */
export const m3Type = {
  displayLarge: { size: 57, line: 64, weight: 600 },
  displayMedium: { size: 45, line: 52, weight: 600 },
  displaySmall: { size: 36, line: 44, weight: 600 },
  headlineLarge: { size: 32, line: 40, weight: 700 },
  headlineMedium: { size: 28, line: 36, weight: 700 },
  headlineSmall: { size: 24, line: 32, weight: 700 },
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
  small: 8,
  medium: 12,
  large: 20,
  extraLarge: 28,
} as const;

/**
 * Candy-pastel accent per theme — used by ThemeChip on the library / build pages.
 * Tuned to read as a soft fill (low alpha) with the same hue used for text.
 */
export const themeAccent: Record<string, string> = {
  Quote: '#E84A7A',
  'Spread Gratitude': '#B775C9',
  'Think this instead of that': '#D0834C',
  'Blog post': '#6F87C9',
  'Gratitude stories': '#5FA37F',
  Affn: '#D85F9A',
  'Dose of Motivation': '#9C9C9C',
};
