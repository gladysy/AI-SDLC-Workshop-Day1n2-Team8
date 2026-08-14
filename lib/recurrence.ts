import type { RecurrencePattern } from './db';
import { SINGAPORE_OFFSET } from './timezone';

interface SingaporeDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parseSingaporeIso(input: string): SingaporeDateParts {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid due date');
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  const rawHour = getPart('hour');
  const hour = rawHour === '24' ? 0 : Number(rawHour);

  return {
    year: Number(getPart('year')),
    month: Number(getPart('month')),
    day: Number(getPart('day')),
    hour,
    minute: Number(getPart('minute')),
    second: Number(getPart('second')),
  };
}

function toSingaporeIso(parts: SingaporeDateParts): string {
  const yyyy = String(parts.year).padStart(4, '0');
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  const hh = String(parts.hour).padStart(2, '0');
  const min = String(parts.minute).padStart(2, '0');
  const ss = String(parts.second).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${SINGAPORE_OFFSET}`;
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function shiftDays(parts: SingaporeDateParts, days: number): SingaporeDateParts {
  const utcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const shifted = new Date(utcMs + days * 24 * 60 * 60 * 1000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

export function isRecurrencePattern(value: unknown): value is RecurrencePattern {
  return (
    value === 'daily' ||
    value === 'weekly' ||
    value === 'monthly' ||
    value === 'yearly'
  );
}

export function calculateNextDueDate(
  currentDueDate: string,
  pattern: RecurrencePattern
): string {
  const current = parseSingaporeIso(currentDueDate);

  switch (pattern) {
    case 'daily':
      return toSingaporeIso(shiftDays(current, 1));
    case 'weekly':
      return toSingaporeIso(shiftDays(current, 7));
    case 'monthly': {
      const targetMonth = current.month === 12 ? 1 : current.month + 1;
      const targetYear = current.month === 12 ? current.year + 1 : current.year;
      const clampedDay = Math.min(current.day, daysInMonth(targetYear, targetMonth));
      return toSingaporeIso({
        ...current,
        year: targetYear,
        month: targetMonth,
        day: clampedDay,
      });
    }
    case 'yearly': {
      const targetYear = current.year + 1;
      const clampedDay = Math.min(current.day, daysInMonth(targetYear, current.month));
      return toSingaporeIso({
        ...current,
        year: targetYear,
        day: clampedDay,
      });
    }
  }
}