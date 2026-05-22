import { pad2 } from '@/lib/manifest/build';

export function daysInMonth(year: number, monthOneBased: number): number {
  // monthOneBased: 1..12
  return new Date(year, monthOneBased, 0).getDate();
}

export function isoDate(year: number, monthOneBased: number, day: number): string {
  return `${year}-${pad2(monthOneBased)}-${pad2(day)}`;
}

export function listMonthDates(year: number, monthOneBased: number): string[] {
  const n = daysInMonth(year, monthOneBased);
  const out: string[] = [];
  for (let d = 1; d <= n; d++) out.push(isoDate(year, monthOneBased, d));
  return out;
}

export function nextMonth(year: number, monthOneBased: number): { year: number; month: number } {
  if (monthOneBased === 12) return { year: year + 1, month: 1 };
  return { year, month: monthOneBased + 1 };
}

export function prevMonth(year: number, monthOneBased: number): { year: number; month: number } {
  if (monthOneBased === 1) return { year: year - 1, month: 12 };
  return { year, month: monthOneBased - 1 };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatMonth(year: number, monthOneBased: number): string {
  return `${MONTH_NAMES[monthOneBased - 1]} ${year}`;
}

export function dayOfWeek(year: number, monthOneBased: number, day: number): number {
  // 0 = Sun .. 6 = Sat
  return new Date(year, monthOneBased - 1, day).getDay();
}
