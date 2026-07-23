import type { SystemCost } from '@/types/cost';
import type { EnergyReading, ReadingDraft, WarningCode } from '@/types/reading';
import type { SystemProfile } from '@/types/system';
import {
  addDaysToDate,
  buildDateFromParts,
  differenceInCalendarDays,
  getDaysInMonth,
  getDateTimeTimestamp,
  getMonthPrefix,
  getYearPrefix,
  isDateWithinRange,
  sortReadingsAscending,
} from '@/utils/date';

type ReadingPreview = {
  gridConsumptionKwh: number;
  solarGenerationKwh: number;
  exportedEnergyKwh: number;
  selfConsumedSolarKwh: number;
  estimatedHomeUsageKwh: number;
  estimatedSavings: number;
  estimatedGridCost: number;
  importRate: number;
  exportRate?: number;
  warningCodes: WarningCode[];
};

export type PaybackForecastWindow = '30d' | '90d' | 'all';
export type InsightsRange = '7d' | '30d' | 'current-month' | 'previous-month' | 'current-year' | 'all' | 'custom';
type ReadingValueField = 'gridReading' | 'solarReading' | 'exportReading';

type PaybackForecast = {
  window: PaybackForecastWindow;
  averageDailySavings: number;
  projectedDaysToPayback?: number;
  estimatedPaybackDate?: string;
  basedOnReadingCount: number;
  hasEnoughSavingsData: boolean;
};

export type BillingCycleWindow = {
  startDate: string;
  endDate: string;
  nextStartDate: string;
  elapsedDays: number;
  totalDays: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeBillingCycleStartDay(billingCycleStartDay = 1): number {
  return Math.min(31, Math.max(1, Math.trunc(billingCycleStartDay)));
}

export type DailyReadingSummary = {
  date: string;
  readingCount: number;
  solarGenerationKwh: number;
  gridConsumptionKwh: number;
  exportedEnergyKwh: number;
  selfConsumedSolarKwh: number;
  estimatedHomeUsageKwh: number;
  estimatedSavings: number;
  estimatedGridCost: number;
};

export type PreviousReadingSet = {
  any?: EnergyReading;
  grid?: EnergyReading;
  solar?: EnergyReading;
  export?: EnergyReading;
};

function getDailyValue({
  mode,
  currentValue,
  previousValue,
  meterReset,
}: {
  mode: 'daily' | 'cumulative';
  currentValue?: number;
  previousValue?: number;
  meterReset?: boolean;
}): number {
  if (typeof currentValue !== 'number') {
    return 0;
  }

  if (mode === 'daily') {
    return currentValue;
  }

  if (typeof previousValue !== 'number') {
    return 0;
  }

  const delta = currentValue - previousValue;
  if (delta >= 0) {
    return delta;
  }

  return meterReset ? currentValue : 0;
}

function collectWarnings({
  profile,
  previousReadings,
  draft,
  solarGenerationKwh,
  exportedEnergyKwh,
  importRate,
}: {
  profile: SystemProfile;
  previousReadings: PreviousReadingSet;
  draft: ReadingDraft;
  solarGenerationKwh: number;
  exportedEnergyKwh: number;
  importRate: number;
}): WarningCode[] {
  const warnings: WarningCode[] = [];

  if (
    profile.gridInputMode === 'cumulative' &&
    typeof draft.gridReading === 'number' &&
    typeof previousReadings.grid?.gridReading === 'number' &&
    draft.gridReading < previousReadings.grid.gridReading &&
    !draft.meterReset
  ) {
    warnings.push('cumulative-lower-than-prior');
  }

  if (
    profile.solarInputMode === 'cumulative' &&
    typeof draft.solarReading === 'number' &&
    typeof previousReadings.solar?.solarReading === 'number' &&
    draft.solarReading < previousReadings.solar.solarReading &&
    !draft.meterReset
  ) {
    warnings.push('cumulative-lower-than-prior');
  }

  if (
    profile.exportInputMode === 'cumulative' &&
    typeof draft.exportReading === 'number' &&
    typeof previousReadings.export?.exportReading === 'number' &&
    draft.exportReading < previousReadings.export.exportReading &&
    !draft.meterReset
  ) {
    warnings.push('cumulative-lower-than-prior');
  }

  if (profile.solarCapacityKw && solarGenerationKwh > profile.solarCapacityKw * 8) {
    warnings.push('unusually-high-solar');
  }

  if (exportedEnergyKwh > solarGenerationKwh) {
    warnings.push('export-higher-than-solar');
  }

  if (importRate === 0) {
    warnings.push('zero-electricity-rate');
  }

  return [...new Set(warnings)];
}

export function findPreviousReading(readings: EnergyReading[], draft: Pick<ReadingDraft, 'date' | 'time'>): EnergyReading | undefined {
  const sorted = sortReadingsAscending(readings);
  const currentDateTime = getDateTimeTimestamp(draft.date, draft.time);

  return sorted
    .filter((reading) => {
      const readingDateTime = getDateTimeTimestamp(reading.date, reading.time);
      return readingDateTime < currentDateTime;
    })
    .at(-1);
}

function findPreviousReadingForField(
  readings: EnergyReading[],
  draft: Pick<ReadingDraft, 'date' | 'time'>,
  field: ReadingValueField,
): EnergyReading | undefined {
  const sorted = sortReadingsAscending(readings);
  const currentDateTime = getDateTimeTimestamp(draft.date, draft.time);

  return sorted
    .filter((reading) => {
      const readingDateTime = getDateTimeTimestamp(reading.date, reading.time);
      return readingDateTime < currentDateTime && typeof reading[field] === 'number';
    })
    .at(-1);
}

export function findPreviousReadings(readings: EnergyReading[], draft: Pick<ReadingDraft, 'date' | 'time'>): PreviousReadingSet {
  return {
    any: findPreviousReading(readings, draft),
    grid: findPreviousReadingForField(readings, draft, 'gridReading'),
    solar: findPreviousReadingForField(readings, draft, 'solarReading'),
    export: findPreviousReadingForField(readings, draft, 'exportReading'),
  };
}

export function buildReadingPreview({
  draft,
  profile,
  previousReadings,
}: {
  draft: ReadingDraft;
  profile: SystemProfile;
  previousReadings: PreviousReadingSet;
}): ReadingPreview {
  const importRate = draft.importRate ?? profile.defaultImportRate;
  const exportRate = profile.exportInputMode === 'disabled' ? undefined : draft.exportRate ?? profile.defaultExportRate;

  const gridConsumptionKwh = round(
    getDailyValue({
      mode: profile.gridInputMode,
      currentValue: draft.gridReading,
      previousValue: previousReadings.grid?.gridReading,
      meterReset: draft.meterReset,
    }),
  );
  const solarGenerationKwh = round(
    getDailyValue({
      mode: profile.solarInputMode,
      currentValue: draft.solarReading,
      previousValue: previousReadings.solar?.solarReading,
      meterReset: draft.meterReset,
    }),
  );
  const exportedEnergyKwh = round(
    profile.exportInputMode === 'disabled'
      ? 0
      : getDailyValue({
          mode: profile.exportInputMode,
          currentValue: draft.exportReading,
          previousValue: previousReadings.export?.exportReading,
          meterReset: draft.meterReset,
        }),
  );
  const selfConsumedSolarKwh = round(
    profile.exportInputMode === 'disabled' ? solarGenerationKwh : Math.max(0, solarGenerationKwh - exportedEnergyKwh),
  );
  const estimatedHomeUsageKwh = round(gridConsumptionKwh + selfConsumedSolarKwh);
  const estimatedSavings = round(
    profile.exportInputMode === 'disabled'
      ? solarGenerationKwh * importRate
      : selfConsumedSolarKwh * importRate + exportedEnergyKwh * (exportRate ?? 0),
  );
  const estimatedGridCost = round(gridConsumptionKwh * importRate);

  return {
    gridConsumptionKwh,
    solarGenerationKwh,
    exportedEnergyKwh,
    selfConsumedSolarKwh,
    estimatedHomeUsageKwh,
    estimatedSavings,
    estimatedGridCost,
    importRate,
    exportRate,
    warningCodes: collectWarnings({
      profile,
      previousReadings,
      draft,
      solarGenerationKwh,
      exportedEnergyKwh,
      importRate,
    }),
  };
}

export function createReadingRecord({
  draft,
  profile,
  previousReadings,
  id,
  createdAt,
}: {
  draft: ReadingDraft;
  profile: SystemProfile;
  previousReadings: PreviousReadingSet;
  id: string;
  createdAt: string;
}): EnergyReading {
  const preview = buildReadingPreview({ draft, profile, previousReadings });

  return {
    id,
    date: draft.date,
    time: draft.time,
    gridReading: draft.gridReading,
    gridConsumptionKwh: preview.gridConsumptionKwh,
    solarReading: draft.solarReading,
    solarGenerationKwh: preview.solarGenerationKwh,
    exportReading: profile.exportInputMode === 'disabled' ? undefined : draft.exportReading,
    exportedEnergyKwh: preview.exportedEnergyKwh,
    selfConsumedSolarKwh: preview.selfConsumedSolarKwh,
    estimatedHomeUsageKwh: preview.estimatedHomeUsageKwh,
    importRate: preview.importRate,
    exportRate: preview.exportRate,
    estimatedSavings: preview.estimatedSavings,
    estimatedGridCost: preview.estimatedGridCost,
    notes: draft.notes?.trim() || undefined,
    meterReset: draft.meterReset || undefined,
    warningCodes: preview.warningCodes.length > 0 ? preview.warningCodes : undefined,
    createdAt,
    updatedAt: createdAt,
  };
}

export function filterDashboardReadings({
  readings,
  today,
  period,
}: {
  readings: EnergyReading[];
  today: string;
  period: '7d' | '30d' | 'month' | 'year' | 'all';
}): EnergyReading[] {
  if (period === 'all') {
    return readings;
  }

  if (period === 'month') {
    const monthPrefix = getMonthPrefix(today);
    return readings.filter((reading) => reading.date.startsWith(monthPrefix));
  }

  if (period === 'year') {
    const yearPrefix = getYearPrefix(today);
    return readings.filter((reading) => reading.date.startsWith(yearPrefix));
  }

  const days = period === '7d' ? 7 : 30;
  return readings.filter((reading) => differenceInCalendarDays(today, reading.date) >= 0 && differenceInCalendarDays(today, reading.date) < days);
}

export function getBillingCycleStartDate(today: string, billingCycleStartDay = 1): string {
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const cycleDay = normalizeBillingCycleStartDay(billingCycleStartDay);
  const currentMonthCycleDay = Math.min(cycleDay, getDaysInMonth(todayYear, todayMonth));
  let startYear = todayYear;
  let startMonth = todayMonth;

  if (todayDay < currentMonthCycleDay) {
    startMonth -= 1;

    if (startMonth === 0) {
      startMonth = 12;
      startYear -= 1;
    }
  }

  const clampedDay = Math.min(cycleDay, getDaysInMonth(startYear, startMonth));
  return buildDateFromParts(startYear, startMonth, clampedDay);
}

export function getBillingCycleWindow({
  today,
  billingCycleStartDay,
}: {
  today: string;
  billingCycleStartDay?: number;
}): BillingCycleWindow {
  const cycleDay = normalizeBillingCycleStartDay(billingCycleStartDay);
  const startDate = getBillingCycleStartDate(today, cycleDay);
  const [startYear, startMonth] = startDate.split('-').map(Number);
  let nextStartYear = startYear;
  let nextStartMonth = startMonth + 1;

  if (nextStartMonth === 13) {
    nextStartMonth = 1;
    nextStartYear += 1;
  }

  const nextStartDay = Math.min(cycleDay, getDaysInMonth(nextStartYear, nextStartMonth));
  const nextStartDate = buildDateFromParts(nextStartYear, nextStartMonth, nextStartDay);
  const totalDays = Math.max(1, differenceInCalendarDays(nextStartDate, startDate));
  const elapsedDays = Math.max(1, Math.min(totalDays, differenceInCalendarDays(today, startDate) + 1));

  return {
    startDate,
    endDate: addDaysToDate(nextStartDate, -1),
    nextStartDate,
    elapsedDays,
    totalDays,
  };
}

export function filterBillingCycleReadings({
  readings,
  today,
  billingCycleStartDay,
}: {
  readings: EnergyReading[];
  today: string;
  billingCycleStartDay?: number;
}): EnergyReading[] {
  const cycleStartDate = getBillingCycleStartDate(today, billingCycleStartDay);
  return readings.filter((reading) => reading.date >= cycleStartDate && reading.date <= today);
}

export function filterInsightsReadingsByRange({
  readings,
  today,
  range,
  customStartDate,
  customEndDate,
}: {
  readings: EnergyReading[];
  today: string;
  range: InsightsRange;
  customStartDate?: string;
  customEndDate?: string;
}): EnergyReading[] {
  if (range === 'all') {
    return readings;
  }

  if (range === 'current-month') {
    const monthPrefix = getMonthPrefix(today);
    return readings.filter((reading) => reading.date.startsWith(monthPrefix));
  }

  if (range === 'previous-month') {
    const previousMonthDate = addDaysToDate(`${getMonthPrefix(today)}-01`, -1);
    const monthPrefix = getMonthPrefix(previousMonthDate);
    return readings.filter((reading) => reading.date.startsWith(monthPrefix));
  }

  if (range === 'current-year') {
    const yearPrefix = getYearPrefix(today);
    return readings.filter((reading) => reading.date.startsWith(yearPrefix));
  }

  if (range === 'custom') {
    return readings.filter((reading) => isDateWithinRange(reading.date, customStartDate, customEndDate));
  }

  const days = range === '7d' ? 7 : 30;
  return readings.filter((reading) => differenceInCalendarDays(today, reading.date) >= 0 && differenceInCalendarDays(today, reading.date) < days);
}

export function summarizeReadings(readings: EnergyReading[]) {
  const summary = readings.reduce(
    (summary, reading) => {
      summary.solarGeneratedKwh += reading.solarGenerationKwh;
      summary.gridConsumedKwh += reading.gridConsumptionKwh;
      summary.selfConsumedSolarKwh += reading.selfConsumedSolarKwh;
      summary.homeUsageKwh += reading.estimatedHomeUsageKwh;
      summary.estimatedSavings += reading.estimatedSavings;
      summary.estimatedGridCost += reading.estimatedGridCost;
      return summary;
    },
    {
      solarGeneratedKwh: 0,
      gridConsumedKwh: 0,
      selfConsumedSolarKwh: 0,
      homeUsageKwh: 0,
      estimatedSavings: 0,
      estimatedGridCost: 0,
    },
  );

  return {
    solarGeneratedKwh: round(summary.solarGeneratedKwh),
    gridConsumedKwh: round(summary.gridConsumedKwh),
    selfConsumedSolarKwh: round(summary.selfConsumedSolarKwh),
    homeUsageKwh: round(summary.homeUsageKwh),
    estimatedSavings: round(summary.estimatedSavings),
    estimatedGridCost: round(summary.estimatedGridCost),
  };
}

export function aggregateReadingsByDate(readings: EnergyReading[]): DailyReadingSummary[] {
  const grouped = new Map<string, DailyReadingSummary>();

  for (const reading of readings) {
    const existing = grouped.get(reading.date);

    if (existing) {
      existing.readingCount += 1;
      existing.solarGenerationKwh += reading.solarGenerationKwh;
      existing.gridConsumptionKwh += reading.gridConsumptionKwh;
      existing.exportedEnergyKwh += reading.exportedEnergyKwh;
      existing.selfConsumedSolarKwh += reading.selfConsumedSolarKwh;
      existing.estimatedHomeUsageKwh += reading.estimatedHomeUsageKwh;
      existing.estimatedSavings += reading.estimatedSavings;
      existing.estimatedGridCost += reading.estimatedGridCost;
      continue;
    }

    grouped.set(reading.date, {
      date: reading.date,
      readingCount: 1,
      solarGenerationKwh: reading.solarGenerationKwh,
      gridConsumptionKwh: reading.gridConsumptionKwh,
      exportedEnergyKwh: reading.exportedEnergyKwh,
      selfConsumedSolarKwh: reading.selfConsumedSolarKwh,
      estimatedHomeUsageKwh: reading.estimatedHomeUsageKwh,
      estimatedSavings: reading.estimatedSavings,
      estimatedGridCost: reading.estimatedGridCost,
    });
  }

  return [...grouped.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((summary) => ({
      ...summary,
      solarGenerationKwh: round(summary.solarGenerationKwh),
      gridConsumptionKwh: round(summary.gridConsumptionKwh),
      exportedEnergyKwh: round(summary.exportedEnergyKwh),
      selfConsumedSolarKwh: round(summary.selfConsumedSolarKwh),
      estimatedHomeUsageKwh: round(summary.estimatedHomeUsageKwh),
      estimatedSavings: round(summary.estimatedSavings),
      estimatedGridCost: round(summary.estimatedGridCost),
    }));
}

export function buildDailyEnergySeries({
  readings,
  endDate,
  days,
}: {
  readings: EnergyReading[];
  endDate: string;
  days: number;
}) {
  const dailyReadings = aggregateReadingsByDate(readings);
  const readingsByDate = new Map(dailyReadings.map((reading) => [reading.date, reading]));

  return Array.from({ length: days }, (_, index) => {
    const date = addDaysToDate(endDate, index - (days - 1));
    const reading = readingsByDate.get(date);

    return {
      date,
      solarGenerationKwh: reading?.solarGenerationKwh ?? 0,
      gridConsumptionKwh: reading?.gridConsumptionKwh ?? 0,
    };
  });
}

export function readingToDraft(reading: EnergyReading): ReadingDraft {
  return {
    date: reading.date,
    time: reading.time,
    gridReading: reading.gridReading,
    solarReading: reading.solarReading,
    exportReading: reading.exportReading,
    importRate: reading.importRate,
    exportRate: reading.exportRate,
    notes: reading.notes,
    meterReset: reading.meterReset,
  };
}

export function recalculateReadings({
  readings,
  profile,
}: {
  readings: EnergyReading[];
  profile: SystemProfile;
}): EnergyReading[] {
  const recalculated: EnergyReading[] = [];
  let previousGridReading: EnergyReading | undefined;
  let previousSolarReading: EnergyReading | undefined;
  let previousExportReading: EnergyReading | undefined;

  for (const reading of sortReadingsAscending(readings)) {
    const previousReading = recalculated.at(-1);
    const preview = buildReadingPreview({
      draft: readingToDraft(reading),
      profile,
      previousReadings: {
        any: previousReading,
        grid: previousGridReading,
        solar: previousSolarReading,
        export: previousExportReading,
      },
    });

    const nextReading = {
      ...reading,
      gridConsumptionKwh: preview.gridConsumptionKwh,
      solarGenerationKwh: preview.solarGenerationKwh,
      exportedEnergyKwh: preview.exportedEnergyKwh,
      selfConsumedSolarKwh: preview.selfConsumedSolarKwh,
      estimatedHomeUsageKwh: preview.estimatedHomeUsageKwh,
      importRate: preview.importRate,
      exportRate: preview.exportRate,
      estimatedSavings: preview.estimatedSavings,
      estimatedGridCost: preview.estimatedGridCost,
      warningCodes: preview.warningCodes.length > 0 ? preview.warningCodes : undefined,
    };

    recalculated.push(nextReading);

    if (typeof nextReading.gridReading === 'number') {
      previousGridReading = nextReading;
    }

    if (typeof nextReading.solarReading === 'number') {
      previousSolarReading = nextReading;
    }

    if (typeof nextReading.exportReading === 'number') {
      previousExportReading = nextReading;
    }
  }

  return recalculated;
}

export function deletionAffectsLaterCumulativeReadings({
  readings,
  reading,
  profile,
}: {
  readings: EnergyReading[];
  reading: EnergyReading;
  profile: SystemProfile;
}): boolean {
  const hasCumulativeMode =
    profile.gridInputMode === 'cumulative' ||
    profile.solarInputMode === 'cumulative' ||
    profile.exportInputMode === 'cumulative';

  if (!hasCumulativeMode) {
    return false;
  }

  const sorted = sortReadingsAscending(readings);
  const readingIndex = sorted.findIndex((entry) => entry.id === reading.id);
  return readingIndex >= 0 && readingIndex < sorted.length - 1;
}

export function calculateSolarContribution(reading?: Pick<EnergyReading, 'estimatedHomeUsageKwh' | 'selfConsumedSolarKwh'>): number {
  if (!reading || reading.estimatedHomeUsageKwh === 0) {
    return 0;
  }

  return (reading.selfConsumedSolarKwh / reading.estimatedHomeUsageKwh) * 100;
}

export function summarizeRoi({
  profile,
  readings,
  costs,
}: {
  profile?: SystemProfile | null;
  readings: EnergyReading[];
  costs: SystemCost[];
}) {
  const capitalCosts = costs
    .filter((cost) => cost.costTreatment === 'capital')
    .reduce((sum, cost) => sum + cost.amount, 0);
  const maintenanceCosts = costs
    .filter((cost) => cost.costTreatment === 'maintenance')
    .reduce((sum, cost) => sum + cost.amount, 0);
  const totalEstimatedSavings = readings.reduce((sum, reading) => sum + reading.estimatedSavings, 0);
  const totalCapitalInvestment = (profile?.initialSystemCost ?? 0) + capitalCosts;
  const netSavings = totalEstimatedSavings - maintenanceCosts;
  const roiPercentage = totalCapitalInvestment === 0 ? 0 : (netSavings / totalCapitalInvestment) * 100;
  const remainingAmount = Math.max(0, totalCapitalInvestment - netSavings);

  return {
    additionalCapitalCosts: round(capitalCosts),
    maintenanceCosts: round(maintenanceCosts),
    totalCapitalInvestment: round(totalCapitalInvestment),
    totalEstimatedSavings: round(totalEstimatedSavings),
    netSavings: round(netSavings),
    roiPercentage: round(roiPercentage),
    paybackProgress: Math.max(0, Math.min(100, roiPercentage)),
    remainingAmount: round(remainingAmount),
  };
}

export function estimatePaybackForecast({
  readings,
  remainingAmount,
  window = '30d',
}: {
  readings: EnergyReading[];
  remainingAmount: number;
  window?: PaybackForecastWindow;
}): PaybackForecast {
  const sortedReadings = [...readings].sort((left, right) => right.date.localeCompare(left.date));

  if (sortedReadings.length === 0) {
    return {
      window,
      averageDailySavings: 0,
      basedOnReadingCount: 0,
      hasEnoughSavingsData: false,
    };
  }

  const latestReadingDate = sortedReadings[0].date;
  const windowDays = window === '30d' ? 30 : window === '90d' ? 90 : undefined;
  const windowReadings =
    typeof windowDays === 'number'
      ? sortedReadings.filter((reading) => differenceInCalendarDays(latestReadingDate, reading.date) < windowDays)
      : sortedReadings;
  const validWindowReadings = windowReadings.filter((reading) => Number.isFinite(reading.estimatedSavings));
  const validDailySummaries = aggregateReadingsByDate(validWindowReadings);
  const totalWindowSavings = validDailySummaries.reduce((sum, reading) => sum + reading.estimatedSavings, 0);
  const averageDailySavings = validDailySummaries.length === 0 ? 0 : totalWindowSavings / validDailySummaries.length;
  const hasEnoughSavingsData = averageDailySavings > 0;

  if (!hasEnoughSavingsData) {
    return {
      window,
      averageDailySavings: 0,
      basedOnReadingCount: validDailySummaries.length,
      hasEnoughSavingsData: false,
    };
  }

  if (remainingAmount <= 0) {
    return {
      window,
      averageDailySavings: round(averageDailySavings),
      projectedDaysToPayback: 0,
      estimatedPaybackDate: latestReadingDate,
      basedOnReadingCount: validDailySummaries.length,
      hasEnoughSavingsData: true,
    };
  }

  const projectedDaysToPayback = remainingAmount / averageDailySavings;

  return {
    window,
    averageDailySavings: round(averageDailySavings),
    projectedDaysToPayback: round(projectedDaysToPayback),
    estimatedPaybackDate: addDaysToDate(latestReadingDate, Math.ceil(projectedDaysToPayback)),
    basedOnReadingCount: validDailySummaries.length,
    hasEnoughSavingsData: true,
  };
}
