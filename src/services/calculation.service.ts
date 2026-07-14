import type { SystemCost } from '@/types/cost';
import type { EnergyReading, ReadingDraft, WarningCode } from '@/types/reading';
import type { SystemProfile } from '@/types/system';
import { sortReadingsAscending } from '@/utils/date';

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

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

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
  previousReading,
  draft,
  solarGenerationKwh,
  exportedEnergyKwh,
  importRate,
}: {
  profile: SystemProfile;
  previousReading?: EnergyReading;
  draft: ReadingDraft;
  solarGenerationKwh: number;
  exportedEnergyKwh: number;
  importRate: number;
}): WarningCode[] {
  const warnings: WarningCode[] = [];

  if (
    profile.gridInputMode === 'cumulative' &&
    typeof draft.gridReading === 'number' &&
    typeof previousReading?.gridReading === 'number' &&
    draft.gridReading < previousReading.gridReading &&
    !draft.meterReset
  ) {
    warnings.push('cumulative-lower-than-prior');
  }

  if (
    profile.solarInputMode === 'cumulative' &&
    typeof draft.solarReading === 'number' &&
    typeof previousReading?.solarReading === 'number' &&
    draft.solarReading < previousReading.solarReading &&
    !draft.meterReset
  ) {
    warnings.push('cumulative-lower-than-prior');
  }

  if (
    profile.exportInputMode === 'cumulative' &&
    typeof draft.exportReading === 'number' &&
    typeof previousReading?.exportReading === 'number' &&
    draft.exportReading < previousReading.exportReading &&
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
  const currentDateTime = new Date(draft.time ? `${draft.date}T${draft.time}:00` : `${draft.date}T23:59:59`).getTime();

  return sorted
    .filter((reading) => {
      const readingDateTime = new Date(reading.time ? `${reading.date}T${reading.time}:00` : `${reading.date}T23:59:59`).getTime();
      return readingDateTime < currentDateTime;
    })
    .at(-1);
}

export function buildReadingPreview({
  draft,
  profile,
  previousReading,
}: {
  draft: ReadingDraft;
  profile: SystemProfile;
  previousReading?: EnergyReading;
}): ReadingPreview {
  const importRate = draft.importRate ?? profile.defaultImportRate;
  const exportRate = profile.exportInputMode === 'disabled' ? undefined : draft.exportRate ?? profile.defaultExportRate;

  const gridConsumptionKwh = round(
    getDailyValue({
      mode: profile.gridInputMode,
      currentValue: draft.gridReading,
      previousValue: previousReading?.gridReading,
      meterReset: draft.meterReset,
    }),
  );
  const solarGenerationKwh = round(
    getDailyValue({
      mode: profile.solarInputMode,
      currentValue: draft.solarReading,
      previousValue: previousReading?.solarReading,
      meterReset: draft.meterReset,
    }),
  );
  const exportedEnergyKwh = round(
    profile.exportInputMode === 'disabled'
      ? 0
      : getDailyValue({
          mode: profile.exportInputMode,
          currentValue: draft.exportReading,
          previousValue: previousReading?.exportReading,
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
      previousReading,
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
  previousReading,
  id,
  createdAt,
}: {
  draft: ReadingDraft;
  profile: SystemProfile;
  previousReading?: EnergyReading;
  id: string;
  createdAt: string;
}): EnergyReading {
  const preview = buildReadingPreview({ draft, profile, previousReading });

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

export function summarizeReadings(readings: EnergyReading[]) {
  return readings.reduce(
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
    totalCapitalInvestment,
    maintenanceCosts,
    totalEstimatedSavings,
    netSavings,
    roiPercentage,
    paybackProgress: Math.max(0, Math.min(100, roiPercentage)),
    remainingAmount,
  };
}
