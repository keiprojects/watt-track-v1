import { describe, expect, it } from 'vitest';

import {
  buildReadingPreview,
  estimatePaybackForecast,
  getBillingCycleWindow,
  getPreviousBillingCycleWindow,
  recalculateReadings,
  summarizeRoi,
} from './calculation.service';
import type { SystemCost } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import type { SystemProfile } from '@/types/system';

const timestamp = '2026-07-22T00:00:00.000Z';

const profile: SystemProfile = {
  id: 'system-1',
  systemName: 'QA Solar',
  installationDate: '2026-01-01',
  currency: 'PHP',
  timezone: 'Asia/Manila',
  solarCapacityKw: 2,
  initialSystemCost: 150000,
  defaultImportRate: 12,
  defaultExportRate: 5,
  billingCycleStartDay: 1,
  gridInputMode: 'cumulative',
  solarInputMode: 'cumulative',
  exportInputMode: 'cumulative',
  createdAt: timestamp,
  updatedAt: timestamp,
};

function reading(overrides: Partial<EnergyReading>): EnergyReading {
  return {
    id: 'reading-1',
    date: '2026-07-21',
    gridConsumptionKwh: 0,
    solarGenerationKwh: 0,
    exportedEnergyKwh: 0,
    selfConsumedSolarKwh: 0,
    estimatedHomeUsageKwh: 0,
    importRate: 12,
    estimatedSavings: 0,
    estimatedGridCost: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('buildReadingPreview', () => {
  it('derives cumulative daily values and estimated PHP savings', () => {
    const preview = buildReadingPreview({
      profile,
      previousReadings: {
        grid: reading({ id: 'previous-grid', gridReading: 100 }),
        solar: reading({ id: 'previous-solar', solarReading: 200 }),
        export: reading({ id: 'previous-export', exportReading: 10 }),
      },
      draft: {
        date: '2026-07-22',
        gridReading: 115,
        solarReading: 230,
        exportReading: 14,
      },
    });

    expect(preview).toMatchObject({
      gridConsumptionKwh: 15,
      solarGenerationKwh: 30,
      exportedEnergyKwh: 4,
      selfConsumedSolarKwh: 26,
      estimatedHomeUsageKwh: 41,
      estimatedSavings: 332,
      estimatedGridCost: 180,
      importRate: 12,
      exportRate: 5,
    });
    expect(preview.warningCodes).toContain('unusually-high-solar');
  });

  it('warns and zeroes lower cumulative readings without a meter reset', () => {
    const preview = buildReadingPreview({
      profile,
      previousReadings: {
        grid: reading({ gridReading: 100 }),
        solar: reading({ solarReading: 200 }),
        export: reading({ exportReading: 10 }),
      },
      draft: {
        date: '2026-07-22',
        gridReading: 90,
        solarReading: 190,
        exportReading: 8,
      },
    });

    expect(preview.gridConsumptionKwh).toBe(0);
    expect(preview.solarGenerationKwh).toBe(0);
    expect(preview.exportedEnergyKwh).toBe(0);
    expect(preview.warningCodes).toEqual(['cumulative-lower-than-prior']);
  });
});

describe('recalculateReadings', () => {
  it('uses the previous reading for each cumulative field independently', () => {
    const readings = recalculateReadings({
      profile,
      readings: [
        reading({ id: 'day-1', date: '2026-07-20', gridReading: 100, solarReading: 200, exportReading: 10 }),
        reading({ id: 'day-2', date: '2026-07-21', gridReading: 112 }),
        reading({ id: 'day-3', date: '2026-07-22', solarReading: 235, exportReading: 15 }),
      ],
    });

    expect(readings.find((entry) => entry.id === 'day-2')).toMatchObject({
      gridConsumptionKwh: 12,
      solarGenerationKwh: 0,
      exportedEnergyKwh: 0,
    });
    expect(readings.find((entry) => entry.id === 'day-3')).toMatchObject({
      gridConsumptionKwh: 0,
      solarGenerationKwh: 35,
      exportedEnergyKwh: 5,
    });
  });
});

describe('ROI and payback', () => {
  it('separates capital and maintenance costs in ROI summaries', () => {
    const costs: SystemCost[] = [
      {
        id: 'cost-capital',
        date: '2026-07-01',
        category: 'upgrade',
        description: 'Battery',
        amount: 50000,
        costTreatment: 'capital',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: 'cost-maintenance',
        date: '2026-07-15',
        category: 'maintenance',
        description: 'Cleaning',
        amount: 1000,
        costTreatment: 'maintenance',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];

    const roi = summarizeRoi({
      profile,
      costs,
      readings: [reading({ estimatedSavings: 6000 })],
    });

    expect(roi).toMatchObject({
      additionalCapitalCosts: 50000,
      maintenanceCosts: 1000,
      totalCapitalInvestment: 200000,
      totalEstimatedSavings: 6000,
      netSavings: 5000,
      roiPercentage: 2.5,
      remainingAmount: 195000,
    });
  });

  it('projects payback from daily savings windows', () => {
    const forecast = estimatePaybackForecast({
      remainingAmount: 1200,
      window: '30d',
      readings: [
        reading({ id: 'day-1', date: '2026-07-20', estimatedSavings: 200 }),
        reading({ id: 'day-2', date: '2026-07-21', estimatedSavings: 400 }),
      ],
    });

    expect(forecast).toMatchObject({
      averageDailySavings: 300,
      projectedDaysToPayback: 4,
      estimatedPaybackDate: '2026-07-25',
      basedOnReadingCount: 2,
      hasEnoughSavingsData: true,
    });
  });
});

describe('billing cycle windows', () => {
  it('clamps billing cycle starts for shorter months', () => {
    expect(getBillingCycleWindow({ today: '2026-02-15', billingCycleStartDay: 31 })).toMatchObject({
      startDate: '2026-01-31',
      endDate: '2026-02-27',
      nextStartDate: '2026-02-28',
      elapsedDays: 16,
      totalDays: 28,
    });
  });

  it('builds the completed previous billing cycle window', () => {
    expect(getPreviousBillingCycleWindow({ today: '2026-07-23', billingCycleStartDay: 15 })).toMatchObject({
      startDate: '2026-06-15',
      endDate: '2026-07-14',
      nextStartDate: '2026-07-15',
      elapsedDays: 30,
      totalDays: 30,
    });
  });
});
