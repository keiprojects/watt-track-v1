import type { BillingCycleOverride } from '@/types/billing';
import type { EnergyReading } from '@/types/reading';
import {
  addDaysToDate,
  differenceInCalendarDays,
  formatMonthDayLabel,
  formatMonthLabel,
  formatShortDate,
  getYearPrefix,
  parseDateOnlyUtc,
} from '@/utils/date';
import type { GridMeterReadingSummary } from './calculation.service';

export type AnalyticsRange = 'day' | 'week' | 'month' | 'year';

export type BillEstimate = {
  cost: number;
  gridKwh: number;
  rate: number;
  hasOverride: boolean;
};

export type EffectiveBillCycleWindow = {
  startDate: string;
  endDate: string;
  elapsedDays: number;
  totalDays: number;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getEffectiveBillCycleWindow({
  fallbackStartDate,
  fallbackEndDate,
  today,
  override,
}: {
  fallbackStartDate: string;
  fallbackEndDate: string;
  today: string;
  override?: BillingCycleOverride;
}): EffectiveBillCycleWindow {
  const startDate = override?.cycleStartDate ?? fallbackStartDate;
  const endDate = override?.cycleEndDate ?? fallbackEndDate;
  const totalDays = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const elapsedDays = Math.max(1, Math.min(totalDays, differenceInCalendarDays(today, startDate) + 1));

  return {
    startDate,
    endDate,
    elapsedDays,
    totalDays,
  };
}

export function estimateGridBill(
  summary: GridMeterReadingSummary,
  fallbackRate: number,
  overrideRate?: number,
): BillEstimate {
  const weightedRate =
    summary.totalGridMeterConsumptionKwh === 0
      ? fallbackRate
      : summary.estimatedGridMeterCost / summary.totalGridMeterConsumptionKwh;
  const rate = overrideRate ?? weightedRate;

  return {
    cost: roundMoney(summary.totalGridMeterConsumptionKwh * rate),
    gridKwh: summary.totalGridMeterConsumptionKwh,
    rate,
    hasOverride: typeof overrideRate === 'number',
  };
}

export function shiftAnalyticsAnchorDate(date: string, range: AnalyticsRange, direction: -1 | 1): string {
  if (range === 'day') {
    return addDaysToDate(date, direction);
  }

  if (range === 'week') {
    return addDaysToDate(date, direction * 7);
  }

  const nextDate = parseDateOnlyUtc(date);

  if (range === 'month') {
    nextDate.setUTCMonth(nextDate.getUTCMonth() + direction);
  } else {
    nextDate.setUTCFullYear(nextDate.getUTCFullYear() + direction);
  }

  return nextDate.toISOString().slice(0, 10);
}

export function filterReadingsForAnalyticsRange(
  readings: EnergyReading[],
  anchorDate: string,
  range: AnalyticsRange,
): EnergyReading[] {
  if (range === 'day') {
    return readings.filter((reading) => reading.date === anchorDate);
  }

  if (range === 'week') {
    return readings.filter((reading) => {
      const diff = differenceInCalendarDays(anchorDate, reading.date);
      return diff >= 0 && diff < 7;
    });
  }

  if (range === 'month') {
    return readings.filter((reading) => reading.date.startsWith(anchorDate.slice(0, 7)));
  }

  const yearPrefix = getYearPrefix(anchorDate);
  return readings.filter((reading) => reading.date.startsWith(yearPrefix));
}

export function getAnalyticsRangeLabel(anchorDate: string, range: AnalyticsRange): string {
  if (range === 'day') {
    return formatShortDate(anchorDate);
  }

  if (range === 'week') {
    return `${formatMonthDayLabel(addDaysToDate(anchorDate, -6))} - ${formatMonthDayLabel(anchorDate)}`;
  }

  if (range === 'month') {
    return formatMonthLabel(anchorDate);
  }

  return getYearPrefix(anchorDate);
}
