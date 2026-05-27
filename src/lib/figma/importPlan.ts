/**
 * Build a per-slot import plan for a target month from a Figma strings.json.
 * Pure (no fetch). The dialog calls /cards/match afterward to attach
 * a dedup decision per slot.
 */

import { THEME_ORDER, type ThemeName } from '@/lib/constants';
import { listMonthDates } from '@/lib/date';
import {
  THEME_FIGMA_PREFIX,
  bgImageUrlFor,
  dzImageUrlForTheme,
} from './defaults';
import { extractForTheme, type ExtractedSlot, type StringsJson } from './stringsJson';

export type ImportSlot = {
  /** ISO calendar date — YYYY-MM-DD. */
  date: string;
  theme: ThemeName;
  /** Constructed figmaId like `quote_1813`. */
  figmaId: string;
  /** Day index within the month (1-based). */
  day: number;
  /** Image index used for the dz image URL. */
  dzImageUrlIndex: number;
  /** Background image rotation. */
  bgImageUrl: string;
  /** Deterministic dz image URL (PNG uploaded by designers). */
  dzImageUrl: string;
  /** Extracted text/author/URL. `ok: false` when strings.json had no entry. */
  extracted: ExtractedSlot;
};

export type ImportPlan = {
  year: number;
  month: number;
  dzImageUrlStartIndex: number;
  slots: ImportSlot[];
};

export type BuildImportPlanArgs = {
  year: number;
  month: number;
  dzImageUrlStartIndex: number;
  strings: StringsJson;
};

export function buildImportPlan({
  year,
  month,
  dzImageUrlStartIndex,
  strings,
}: BuildImportPlanArgs): ImportPlan {
  const dates = listMonthDates(year, month);
  const slots: ImportSlot[] = [];

  dates.forEach((iso, dayIdx0) => {
    const day = dayIdx0 + 1;
    const dzImageUrlIndex = dzImageUrlStartIndex + dayIdx0;

    (THEME_ORDER as readonly ThemeName[]).forEach((theme, themeIdx0) => {
      const prefix = THEME_FIGMA_PREFIX[theme];
      const figmaId = `${prefix}_${dzImageUrlIndex}`;
      const extracted = extractForTheme(theme, strings, figmaId);
      slots.push({
        date: iso,
        theme,
        figmaId,
        day,
        dzImageUrlIndex,
        bgImageUrl: bgImageUrlFor(dayIdx0, themeIdx0, THEME_ORDER.length),
        dzImageUrl: dzImageUrlForTheme(theme, dzImageUrlIndex),
        extracted,
      });
    });
  });

  return {
    year,
    month,
    dzImageUrlStartIndex,
    slots,
  };
}

/** Convenience: count slots by extraction state for the preview summary. */
export function summarizePlan(plan: ImportPlan): {
  withContent: number;
  noContent: number;
} {
  let withContent = 0;
  let noContent = 0;
  for (const s of plan.slots) {
    if (s.extracted.ok) withContent++;
    else noContent++;
  }
  return { withContent, noContent };
}
