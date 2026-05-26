import type { MonthManifest } from './types';

export function manifestFileName(year: number, month: number): string {
  // Zero-padded month so `2026_06.json` sorts lexicographically and matches
  // the apps' canonical S3 path s3://gratitude-daily-zen/monthly/.
  return `${year}_${String(month).padStart(2, '0')}.json`;
}

/** Trigger a browser download of a manifest as JSON. Works only in the browser. */
export function downloadManifest(year: number, month: number, manifest: MonthManifest): void {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(manifest, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = manifestFileName(year, month);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
