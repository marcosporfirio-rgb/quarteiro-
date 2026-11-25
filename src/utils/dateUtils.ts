export const WEEKDAY_NAMES_MON_FIRST = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const WEEKDAY_SHORTS_MON_FIRST = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function parseParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function toUTCDate(dateStr: string): Date {
  const { year, month, day } = parseParts(dateStr);
  return new Date(Date.UTC(year, month - 1, day));
}

export function fromUTCDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const dt = toUTCDate(dateStr);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUTCDate(dt);
}

export function diffDaysInclusive(startStr: string, endStr: string): number {
  const s = toUTCDate(startStr).getTime();
  const e = toUTCDate(endStr).getTime();
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatShortDateBR(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '—';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

/**
 * Returns 0 for Segunda-feira, ..., 6 for Domingo
 */
export function getDayOfWeekIndex(dateStr: string): number {
  const dt = toUTCDate(dateStr);
  const utcDay = dt.getUTCDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  return (utcDay + 6) % 7;
}

export function getDayOfWeekName(dateStr: string): string {
  return WEEKDAY_NAMES_MON_FIRST[getDayOfWeekIndex(dateStr)];
}

export function getDayOfWeekShort(dateStr: string): string {
  return WEEKDAY_SHORTS_MON_FIRST[getDayOfWeekIndex(dateStr)];
}

export function isWeekday(dateStr: string): boolean {
  const idx = getDayOfWeekIndex(dateStr);
  return idx >= 0 && idx <= 4;
}

export function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  if (startStr > endStr) return dates;
  let cursor = startStr;
  while (cursor <= endStr) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function isValidISODate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const dt = toUTCDate(dateStr);
  return fromUTCDate(dt) === dateStr;
}
