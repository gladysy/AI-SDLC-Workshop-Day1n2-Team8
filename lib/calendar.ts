// Calendar utilities for month-view grid generation (PRP 10).
// Generates a 6x7 grid (42 cells) for consistent month-to-month layout.

import { getSingaporeNow } from './timezone';

function formatSingaporeYmd(input: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(input);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export interface CalendarDay {
  date: string;          // YYYY-MM-DD, Singapore-local
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
}

/**
 * Generate a 6-row x 7-column calendar grid for a given month.
 * Always returns exactly 42 cells (6 rows) regardless of how many weeks
 * the month spans, so grid height never jumps between months.
 *
 * @param year - Full year (e.g., 2026)
 * @param month - 1-indexed month (1 = January, 12 = December)
 * @returns Array of 42 CalendarDay objects
 */
export function generateCalendarGrid(year: number, month: number): CalendarDay[] {
  // month is 1-indexed for readability at call sites
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Get today in Singapore timezone
  const today = formatSingaporeYmd(getSingaporeNow());
  const cells: CalendarDay[] = [];

  // Always emit exactly 6 rows (42 cells) so month-to-month navigation
  // never changes grid height
  const totalCells = 42;
  const leadingDays = startWeekday;

  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - leadingDays + 1;
    const cellDate = new Date(Date.UTC(year, month - 1, dayOffset));
    const dateStr = formatSingaporeYmd(cellDate);
    const weekday = cellDate.getUTCDay();

    cells.push({
      date: dateStr,
      isCurrentMonth: dayOffset >= 1 && dayOffset <= daysInMonth,
      isToday: dateStr === today,
      isPast: dateStr < today,
      isWeekend: weekday === 0 || weekday === 6,
    });
  }

  return cells;
}

/**
 * Parse a month parameter string in YYYY-MM format.
 * Returns the requested month or falls back to the current Singapore month.
 */
export function parseMonthParam(raw: string | null): { year: number; month: number } {
  const now = getSingaporeNow();
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split('-').map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/**
 * Format a year/month to a URL query param string (YYYY-MM).
 */
export function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
