/**
 * Mirror of /Users/divijgupta/Documents/Dev/Gratitude/DailyZen/src/main/kotlin/FigmaReader.kt.
 *
 * Pure parsing of the Figma string export. No fetch, no React.
 */

import type { ThemeName } from '@/lib/constants';

/** Top-level shape of the Figma strings export — a free-form JSON map. */
export type StringsJson = Record<string, unknown>;

export type ExtractedSlot =
  | { ok: true; text: string; author?: string; articleUrl?: string }
  | { ok: false; reason: 'no-strings-entry' };

const JUNK_CHARS = ['"', '“', '”']; // straight + curly quotes

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-find the first string value under any key matching `target`
 * (case-sensitive, exact match) within the given object tree. Mirrors the
 * Kotlin `getValueForKey` helper.
 */
function deepFindString(obj: unknown, target: string): string | null {
  if (!isObject(obj)) return null;
  for (const [k, v] of Object.entries(obj)) {
    if (k === target && typeof v === 'string') return v;
    if (isObject(v)) {
      const nested = deepFindString(v, target);
      if (nested != null) return nested;
    }
  }
  return null;
}

function stripJunk(s: string): string {
  let out = s;
  for (const c of JUNK_CHARS) out = out.split(c).join('');
  return out;
}

function squashWhitespace(s: string): string {
  return s.replace(/\n/g, ' ').replace(/ {2,}/g, ' ').trim();
}

export function parseStringsJson(raw: string): StringsJson {
  const parsed = JSON.parse(raw) as unknown;
  if (!isObject(parsed)) {
    throw new Error('strings.json must be a JSON object at the top level');
  }
  return parsed;
}

/** Coerce a top-level entry value to a Record for deep-find. */
function entryFor(strings: StringsJson, key: string): Record<string, unknown> | null {
  const v = strings[key];
  return isObject(v) ? v : null;
}

/**
 * Extract Quote text + author from `strings[figmaId]`.
 * Looks for `quotetext` / `quoteauthor` (case-sensitive, deep).
 */
export function extractQuote(strings: StringsJson, figmaId: string): ExtractedSlot {
  const obj = entryFor(strings, figmaId);
  if (!obj) return { ok: false, reason: 'no-strings-entry' };
  const text = deepFindString(obj, 'quotetext') ?? '';
  const author = deepFindString(obj, 'quoteauthor') ?? '';
  return {
    ok: true,
    text: squashWhitespace(stripJunk(text)),
    author: stripJunk(author).trim(),
  };
}

export function extractAffn(strings: StringsJson, figmaId: string): ExtractedSlot {
  const obj = entryFor(strings, figmaId);
  if (!obj) return { ok: false, reason: 'no-strings-entry' };
  const text = deepFindString(obj, 'affirmation') ?? '';
  return {
    ok: true,
    text: squashWhitespace(stripJunk(text)),
  };
}

export function extractSpreadGratitude(strings: StringsJson, figmaId: string): ExtractedSlot {
  const obj = entryFor(strings, figmaId);
  if (!obj) return { ok: false, reason: 'no-strings-entry' };
  const kudos = deepFindString(obj, 'kudostext') ?? '';
  return {
    ok: true,
    text: squashWhitespace(`Thank you! ${kudos}`),
  };
}

export function extractThinkBetter(strings: StringsJson, figmaId: string): ExtractedSlot {
  const obj = entryFor(strings, figmaId);
  if (!obj) return { ok: false, reason: 'no-strings-entry' };
  const t1 = stripJunk(deepFindString(obj, 'thinktext1') ?? '').trim();
  const t2 = stripJunk(deepFindString(obj, 'thinktext2') ?? '').trim();
  return {
    ok: true,
    text: squashWhitespace(`Instead of thinking, “${t1}” Think, “${t2}”`),
  };
}

function normalizeBlogStoryUrl(raw: string): string {
  let url = raw.replace(/\n/g, '').replace(/"/g, '').trim();
  if (!url) return '';
  url = `${url}?open=InApp`;
  if (!url.startsWith('https://')) url = `https://${url}`;
  return url;
}

export function extractBlogOrStory(
  strings: StringsJson,
  figmaId: string,
): ExtractedSlot {
  // Blog/story URLs live at the top level under `url_<figmaId>`.
  const raw = strings[`url_${figmaId}`];
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, reason: 'no-strings-entry' };
  }
  const articleUrl = normalizeBlogStoryUrl(raw);
  if (!articleUrl) return { ok: false, reason: 'no-strings-entry' };
  return { ok: true, text: '', articleUrl };
}

/** One-stop dispatch from theme → extractor. */
export function extractForTheme(
  theme: ThemeName,
  strings: StringsJson,
  figmaId: string,
): ExtractedSlot {
  switch (theme) {
    case 'Quote':
      return extractQuote(strings, figmaId);
    case 'Affn':
      return extractAffn(strings, figmaId);
    case 'Spread Gratitude':
      return extractSpreadGratitude(strings, figmaId);
    case 'Think this instead of that':
      return extractThinkBetter(strings, figmaId);
    case 'Blog post':
    case 'Gratitude stories':
      return extractBlogOrStory(strings, figmaId);
  }
}
