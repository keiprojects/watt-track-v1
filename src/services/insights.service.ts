import type { BillingCycleOverride } from '@/types/billing';
import type { CostTreatment, SystemCost, SystemCostCategory } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import {
  addDaysToDate,
  differenceInCalendarDays,
  formatMonthDayLabel,
  formatMonthLabel,
  formatShortDate,
  getTodayDateInputValue,
  getYearPrefix,
  isValidDateInputValue,
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

export type CostDraft = {
  date: string;
  category: SystemCostCategory;
  costTreatment: CostTreatment;
  description: string;
  amount: string;
  notes: string;
};

export type BillCycleDraft = {
  startDate: string;
  endDate: string;
  importRate: string;
};

export type DraftValidationResult<TValue> =
  | { ok: true; value: TValue }
  | { ok: false; title: string; message: string };

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function createDefaultCostDraft(today = getTodayDateInputValue()): CostDraft {
  return {
    date: today,
    category: 'installation',
    costTreatment: 'capital',
    description: '',
    amount: '',
    notes: '',
  };
}

export function createBillCycleDraft(): BillCycleDraft {
  return {
    startDate: '',
    endDate: '',
    importRate: '',
  };
}

export function buildBillingCycleOverrideFromDraft({
  anchorCycleStartDate,
  fallbackStartDate,
  fallbackEndDate,
  draft,
  existingOverride,
  id,
  now,
}: {
  anchorCycleStartDate: string;
  fallbackStartDate: string;
  fallbackEndDate: string;
  draft: BillCycleDraft;
  existingOverride?: BillingCycleOverride;
  id: string;
  now: string;
}): DraftValidationResult<BillingCycleOverride> {
  const cycleStartDate = draft.startDate || existingOverride?.cycleStartDate || fallbackStartDate;
  const cycleEndDate = draft.endDate || existingOverride?.cycleEndDate || fallbackEndDate;
  const importRate = draft.importRate.trim() ? Number(draft.importRate) : existingOverride?.importRate;

  if (!isValidDateInputValue(cycleStartDate) || !isValidDateInputValue(cycleEndDate) || cycleStartDate > cycleEndDate) {
    return {
      ok: false,
      title: 'Check the bill period',
      message: 'Enter a valid start and end date for the utility bill period.',
    };
  }

  if (typeof importRate === 'number' && (!Number.isFinite(importRate) || importRate <= 0)) {
    return {
      ok: false,
      title: 'Check the bill rate',
      message: 'Enter a valid import rate, or leave it blank to keep using reading rates.',
    };
  }

  return {
    ok: true,
    value: {
      id: existingOverride?.id ?? id,
      anchorCycleStartDate,
      cycleStartDate,
      cycleEndDate,
      importRate,
      createdAt: existingOverride?.createdAt ?? now,
      updatedAt: now,
    },
  };
}

export function buildSystemCostFromDraft({
  draft,
  existingCost,
  id,
  now,
  today,
}: {
  draft: CostDraft;
  existingCost?: SystemCost;
  id: string;
  now: string;
  today: string;
}): DraftValidationResult<SystemCost> {
  const amount = Number(draft.amount || 0);

  if (!isValidDateInputValue(draft.date) || draft.date > today) {
    return {
      ok: false,
      title: 'Check the date',
      message: 'Use a real date that is not in the future.',
    };
  }

  if (!draft.description.trim()) {
    return {
      ok: false,
      title: 'Add a description',
      message: 'Name the repair, upgrade, maintenance, or install cost.',
    };
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return {
      ok: false,
      title: 'Check the amount',
      message: 'Use a valid amount of 0 or higher.',
    };
  }

  return {
    ok: true,
    value: {
      id: existingCost?.id ?? id,
      date: draft.date,
      category: draft.category,
      costTreatment: draft.costTreatment,
      description: draft.description.trim(),
      amount,
      notes: draft.notes.trim() || undefined,
      createdAt: existingCost?.createdAt ?? now,
      updatedAt: now,
    },
  };
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
