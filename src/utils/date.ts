import type { EnergyReading } from '@/types/reading';

function asDateTime(value: Pick<EnergyReading, 'date' | 'time'>): number {
  const iso = value.time ? `${value.date}T${value.time}:00` : `${value.date}T00:00:00`;
  return new Date(iso).getTime();
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
