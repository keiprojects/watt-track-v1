import type { CostEstimate, CostSettings } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';

export function wattsToKwh(watts: number, durationMinutes: number): number {
  return (watts * durationMinutes) / 60_000;
}

export function estimateReadingCost(reading: EnergyReading, settings: CostSettings): CostEstimate {
  const kwh = wattsToKwh(reading.watts, reading.durationMinutes);
  return {
    kwh,
    amount: kwh * settings.ratePerKwh,
    currencyCode: settings.currencyCode,
  };
}

export function summarizeReadings(readings: EnergyReading[]) {
  return readings.reduce(
    (summary, reading) => {
      const kwh = wattsToKwh(reading.watts, reading.durationMinutes);
      if (reading.direction === 'generated') {
        summary.generatedKwh += kwh;
      } else {
        summary.consumedKwh += kwh;
      }
      return summary;
    },
    { generatedKwh: 0, consumedKwh: 0 },
  );
}
