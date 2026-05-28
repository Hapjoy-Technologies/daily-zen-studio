/**
 * Derive the set of PNG uploads required after a Figma import. A target
 * exists for every slot where the apply step wrote a fresh `latestDzImageUrl`
 * onto a card — i.e. `create` and `reuse-update` decisions. `reuse` keeps
 * the previous card's existing image; `skip` writes nothing.
 *
 * Pure helper, no fetch — keeps the dialog component thinner and the
 * pairing logic unit-testable.
 */

import type { ThemeName } from '@/lib/constants';
import type { ImportPlan, ImportSlot } from './importPlan';

export type UploadTargetDecision = 'create' | 'reuse-update';

export type UploadTarget = {
  filename: string;            // "quote_1813.png"
  s3Key: string;               // "exp/quote_1813.png"
  publicUrl: string;           // full https://… URL the apps will fetch
  theme: ThemeName;
  date: string;                // YYYY-MM-DD
  day: number;                 // 1-based day in the month
  figmaId: string;             // "quote_1813"
  decision: UploadTargetDecision;
};

/**
 * Caller supplies the decisions array indexed by slot — the dialog already
 * keeps this in state. We only need the kind here, not the full Decision
 * union, so the helper stays decoupled from LibraryCard typing.
 */
export type DecisionKind = 'reuse' | 'reuse-update' | 'create' | 'skip';

export function uploadTargetsFromPlan(
  plan: ImportPlan,
  decisions: { kind: DecisionKind }[],
): UploadTarget[] {
  const targets: UploadTarget[] = [];
  plan.slots.forEach((slot, i) => {
    const d = decisions[i];
    if (!d) return;
    if (d.kind !== 'create' && d.kind !== 'reuse-update') return;
    targets.push(toTarget(slot, d.kind));
  });
  return targets;
}

function toTarget(slot: ImportSlot, decision: UploadTargetDecision): UploadTarget {
  // dzImageUrl = ".../daily-zen-bgimages/exp/<theme>_<idx>.png"
  // Strip everything up to and including "/exp/" → filename. S3 key keeps
  // the "exp/" prefix.
  const marker = '/exp/';
  const idx = slot.dzImageUrl.lastIndexOf(marker);
  const filename =
    idx >= 0
      ? slot.dzImageUrl.slice(idx + marker.length)
      : `${slot.figmaId}.png`;
  return {
    filename,
    s3Key: `exp/${filename}`,
    publicUrl: slot.dzImageUrl,
    theme: slot.theme,
    date: slot.date,
    day: slot.day,
    figmaId: slot.figmaId,
    decision,
  };
}
