import type { MonthManifest } from './types';

export function manifestFileName(year: number, month: number): string {
  return `${year}_${month}.json`;
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
