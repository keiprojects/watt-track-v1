import type { EnergyReading } from '@/types/reading';

const DAY_MS = 24 * 60 * 60 * 1000;

function asDateTime(value: Pick<EnergyReading, 'date' | 'time'>): number {
  const iso = value.time ? `${value.date}T${value.time}:00` : `${value.date}T23:59:59`;
  return new Date(iso).getTime();
}

export function parseDateOnlyUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function sortReadingsAscending(readings: EnergyReading[]): EnergyReading[] {
  return [...readings].sort((left, right) => asDateTime(left) - asDateTime(right));
}

export function sortReadingsDescending(readings: EnergyReading[]): EnergyReading[] {
  return [...readings].sort((left, right) => asDateTime(right) - asDateTime(left));
}

export function formatMonthLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' }).format(
    new Date(`${date}T00:00:00`),
  );
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00`));
}

export function getTodayDateInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
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

export function isDateWithinRange(date: string, startDate?: string, endDate?: string): boolean {
  if (startDate && date < startDate) {
    return false;
  }

  if (endDate && date > endDate) {
    return false;
  }

  return true;
}
