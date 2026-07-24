import { describe, expect, it } from 'vitest';

import type { BillingCycleOverride } from '@/types/billing';
import type { EnergyReading } from '@/types/reading';
import {
  estimateGridBill,
  filterReadingsForAnalyticsRange,
  getAnalyticsRangeLabel,
  getEffectiveBillCycleWindow,
  shiftAnalyticsAnchorDate,
} from './insights.service';

const timestamp = '2026-07-22T00:00:00.000Z';

function reading(id: string, date: string): EnergyReading {
  return {
    id,
    date,
    gridConsumptionKwh: 10,
    solarGenerationKwh: 20,
    exportedEnergyKwh: 0,
    selfConsumedSolarKwh: 20,
    estimatedHomeUsageKwh: 30,
    importRate: 12,
    estimatedSavings: 240,
    estimatedGridCost: 120,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('analytics ranges', () => {
  const readings = [
    reading('same-day', '2026-07-22'),
    reading('week-start', '2026-07-16'),
    reading('outside-week', '2026-07-15'),
    reading('same-month', '2026-07-01'),
    reading('same-year', '2026-01-01'),
    reading('outside-year', '2025-12-31'),
  ];

  it('filters readings by day, trailing week, month, and year', () => {
    expect(filterReadingsForAnalyticsRange(readings, '2026-07-22', 'day').map((entry) => entry.id)).toEqual(['same-day']);
    expect(filterReadingsForAnalyticsRange(readings, '2026-07-22', 'week').map((entry) => entry.id)).toEqual([
      'same-day',
      'week-start',
    ]);
    expect(filterReadingsForAnalyticsRange(readings, '2026-07-22', 'month').map((entry) => entry.id)).toEqual([
      'same-day',
      'week-start',
      'outside-week',
      'same-month',
    ]);
    expect(filterReadingsForAnalyticsRange(readings, '2026-07-22', 'year').map((entry) => entry.id)).toEqual([
      'same-day',
      'week-start',
      'outside-week',
      'same-month',
      'same-year',
    ]);
  });

  it('shifts anchors by the selected range size', () => {
    expect(shiftAnalyticsAnchorDate('2026-07-22', 'day', -1)).toBe('2026-07-21');
    expect(shiftAnalyticsAnchorDate('2026-07-22', 'week', 1)).toBe('2026-07-29');
    expect(shiftAnalyticsAnchorDate('2026-07-31', 'month', 1)).toBe('2026-08-31');
    expect(shiftAnalyticsAnchorDate('2026-07-22', 'year', -1)).toBe('2025-07-22');
  });

  it('builds display labels for each range', () => {
    expect(getAnalyticsRangeLabel('2026-07-22', 'day')).toBe('Jul 22, 2026');
    expect(getAnalyticsRangeLabel('2026-07-22', 'week')).toBe('Jul 16 - Jul 22');
    expect(getAnalyticsRangeLabel('2026-07-22', 'month')).toBe('July 2026');
    expect(getAnalyticsRangeLabel('2026-07-22', 'year')).toBe('2026');
  });
});

describe('billing cycle insights', () => {
  it('uses fallback billing dates when no override exists', () => {
    expect(
      getEffectiveBillCycleWindow({
        fallbackStartDate: '2026-07-15',
        fallbackEndDate: '2026-08-14',
        today: '2026-07-24',
      }),
    ).toEqual({
      startDate: '2026-07-15',
      endDate: '2026-08-14',
      elapsedDays: 10,
      totalDays: 31,
    });
  });

  it('uses an override billing window and clamps elapsed days to the cycle length', () => {
    const override: BillingCycleOverride = {
      id: 'bill-cycle-1',
      anchorCycleStartDate: '2026-07-15',
      cycleStartDate: '2026-07-20',
      cycleEndDate: '2026-07-22',
      importRate: 14,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    expect(
      getEffectiveBillCycleWindow({
        fallbackStartDate: '2026-07-15',
        fallbackEndDate: '2026-08-14',
        today: '2026-07-24',
        override,
      }),
    ).toEqual({
      startDate: '2026-07-20',
      endDate: '2026-07-22',
      elapsedDays: 3,
      totalDays: 3,
    });
  });

  it('estimates grid bills from weighted reading rates or a bill override rate', () => {
    const summary = {
      gridReadingCount: 2,
      totalGridMeterConsumptionKwh: 100,
      estimatedGridMeterCost: 1250,
    };

    expect(estimateGridBill(summary, 11)).toEqual({
      cost: 1250,
      gridKwh: 100,
      rate: 12.5,
      hasOverride: false,
    });
    expect(estimateGridBill(summary, 11, 13.25)).toEqual({
      cost: 1325,
      gridKwh: 100,
      rate: 13.25,
      hasOverride: true,
    });
  });
});
