import type { EnergyReading } from '@/types/reading';

const DAY_MS = 24 * 60 * 60 * 1000;
const MANILA_TIME_ZONE = 'Asia/Manila';
const MANILA_OFFSET = '+08:00';

function asDateTime(value: Pick<EnergyReading, 'date' | 'time'>): number {
  return getDateTimeTimestamp(value.date, value.time);
}

export function parseDateOnlyUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function parseDateOnlyManila(date: string): Date {
  return new Date(`${date}T00:00:00${MANILA_OFFSET}`);
}

export function getDateTimeTimestamp(date: string, time?: string): number {
  return new Date(`${date}T${time ?? '23:59:59'}${MANILA_OFFSET}`).getTime();
}

export function isValidDateInputValue(date: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = parseDateOnlyUtc(date);
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

export function isValidTimeInputValue(time: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return false;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function sortReadingsAscending(readings: EnergyReading[]): EnergyReading[] {
  return [...readings].sort((left, right) => asDateTime(left) - asDateTime(right));
}

export function sortReadingsDescending(readings: EnergyReading[]): EnergyReading[] {
  return [...readings].sort((left, right) => asDateTime(right) - asDateTime(left));
}

export function formatMonthLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: MANILA_TIME_ZONE }).format(
    parseDateOnlyManila(date),
  );
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: MANILA_TIME_ZONE,
  }).format(parseDateOnlyManila(date));
}

export function formatWeekdayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    timeZone: MANILA_TIME_ZONE,
  }).format(parseDateOnlyManila(date));
}

export function formatMonthDayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    timeZone: MANILA_TIME_ZONE,
  }).format(parseDateOnlyManila(date));
}

export function formatMonthShortLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    timeZone: MANILA_TIME_ZONE,
  }).format(parseDateOnlyManila(date));
}

export function getTodayDateInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDaysToDate(date: string, days: number): string {
  const result = parseDateOnlyUtc(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function differenceInCalendarDays(laterDate: string, earlierDate: string): number {
  return Math.floor((parseDateOnlyUtc(laterDate).getTime() - parseDateOnlyUtc(earlierDate).getTime()) / DAY_MS);
}

export function getMonthPrefix(date: string): string {
  return date.slice(0, 7);
}

export function getYearPrefix(date: string): string {
  return date.slice(0, 4);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function buildDateFromParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isDateWithinRange(date: string, startDate?: string, endDate?: string): boolean {
  if (startDate && date < startDate) {
    return false;
  }

  if (endDate && date > endDate) {
    return false;
  }

  return true;
}
