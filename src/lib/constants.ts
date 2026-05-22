export const THEME_ORDER = [
  'Quote',
  'Spread Gratitude',
  'Think this instead of that',
  'Blog post',
  'Gratitude stories',
  'Affn',
] as const;

export type ThemeName = (typeof THEME_ORDER)[number];

export const RETIRED_THEMES = ['Dose of Motivation'] as const;

export const ALL_KNOWN_THEMES = [...THEME_ORDER, ...RETIRED_THEMES] as const;

export const THEME_LABELS: Record<string, string> = {
  Quote: 'Quote',
  'Spread Gratitude': 'Spread Gratitude',
  'Think this instead of that': 'Think Better',
  'Blog post': 'Blog post',
  'Gratitude stories': 'Gratitude story',
  Affn: 'Affirmation',
  'Dose of Motivation': 'Dose of Motivation (retired)',
};

export const THEME_TITLES: Record<string, string> = {
  Quote: 'Quote of the Day',
  'Spread Gratitude': 'Spread Gratitude',
  'Think this instead of that': 'Think Better',
  'Blog post': 'Practicing Gratitude',
  'Gratitude stories': 'Gratitude stories',
  Affn: 'Affirmation',
};

export const THEME_DEFAULT_DZTYPE: Record<string, string> = {
  Quote: 'share',
  'Spread Gratitude': 'send',
  'Think this instead of that': 'share',
  'Blog post': 'read',
  'Gratitude stories': 'read',
  Affn: 'read',
};

export const THEME_DEFAULT_PRIMARY_CTA: Record<string, string> = {
  Quote: 'Share With Friends',
  'Spread Gratitude': 'Send To A Friend',
  'Think this instead of that': 'Share With Friends',
  'Blog post': 'Read Full Post',
  'Gratitude stories': 'Read Full Post',
  Affn: 'Repeat 3 Times',
};

export const SESSION_PASSWORD_KEY = 'dz_editor_password';
export const DRAFT_KEY_PREFIX = 'dz_draft_';
