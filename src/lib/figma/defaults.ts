/**
 * Mirror of /Users/divijgupta/Documents/Dev/Gratitude/DailyZen/src/main/kotlin/Defaults.kt.
 *
 * Per-theme constants needed by the Figma import flow. Kept here (not in
 * `src/lib/constants.ts`) so the Studio's general theme map stays focused
 * on UI; this file is import-pipeline plumbing.
 */

import type { ThemeName } from '@/lib/constants';

/** Prefix used when constructing Figma IDs (e.g. `quote_1813`). */
export const THEME_FIGMA_PREFIX: Record<ThemeName, string> = {
  Quote: 'quote',
  'Spread Gratitude': 'kudos',
  'Think this instead of that': 'think',
  'Blog post': 'blog',
  'Gratitude stories': 'story',
  Affn: 'affn',
};

/** `type` field on each ManifestEntry. Quote and Affn carry their kind; others are blank. */
export const THEME_TYPE: Record<ThemeName, string> = {
  Quote: 'quote',
  'Spread Gratitude': '',
  'Think this instead of that': '',
  'Blog post': '',
  'Gratitude stories': '',
  Affn: 'affn',
};

/** Per-theme share-prefix copy (matches Defaults.SharePrefix). */
export const THEME_SHARE_PREFIX: Record<ThemeName, string> = {
  Quote:
    "Here's a beautiful quote from my Gratitude app to brighten your day 😇 https://links.gratefulness.me/DailyZen",
  'Spread Gratitude':
    "Here's a thank you card for you! Sent from my Gratitude app 💌 https://links.gratefulness.me/DailyZen",
  'Think this instead of that':
    'I found an idea on thinking more positively on my Gratitude app. What do you think? https://links.gratefulness.me/DailyZen',
  'Blog post':
    "I recommend you to read this blog post I found on my Gratitude App ",
  'Gratitude stories':
    "You should definitely read this inspiring story I found on the Gratitude app ",
  Affn:
    "Here's a lovely affirmation from my Gratitude app 🌻 https://links.gratefulness.me/DailyZen",
};

/** Template for the per-theme rendered DZ image. The `<index>` is the day index. */
export function dzImageUrlForTheme(theme: ThemeName, index: number): string {
  const prefix = THEME_FIGMA_PREFIX[theme];
  return `https://static.gratefulness.me/daily-zen-bgimages/exp/${prefix}_${index}.png`;
}

/** Background image rotation (decorative gradient behind the dz image). */
export const BG_IMAGE_URLS: string[] = Array.from({ length: 36 }, (_, i) => {
  // Indices 1-33 are .jpg, 34-36 are .jpeg (matches Defaults.BgImageUrl.bgImages).
  const n = i + 1;
  const ext = n >= 34 ? 'jpeg' : 'jpg';
  return `https://static.gratefulness.me/daily-zen-bgimages/exp/dz_bg_${n}.${ext}`;
});

/** Compute the bg image URL for a (day, themeOrder index) cell. */
export function bgImageUrlFor(dayIndex0: number, themeIndex0: number, themeCount = 6): string {
  const overall = dayIndex0 * themeCount + themeIndex0;
  return BG_IMAGE_URLS[overall % BG_IMAGE_URLS.length];
}
