export type EnergyReading = {
  id: string;
  date: string;
  time?: string;
  gridReading?: number;
  gridConsumptionKwh: number;
  solarReading?: number;
  solarGenerationKwh: number;
  exportReading?: number;
  exportedEnergyKwh: number;
  selfConsumedSolarKwh: number;
  estimatedHomeUsageKwh: number;
  importRate: number;
  exportRate?: number;
  estimatedSavings: number;
  estimatedGridCost: number;
  notes?: string;
  meterReset?: boolean;
  warningCodes?: WarningCode[];
  createdAt: string;
  updatedAt: string;
};

export type WarningCode =
  | 'cumulative-lower-than-prior'
  | 'unusually-high-solar'
  | 'export-higher-than-solar'
  | 'zero-electricity-rate';

export type ReadingDraft = {
  date: string;
  time?: string;
  gridReading?: number;
  solarReading?: number;
  exportReading?: number;
  importRate?: number;
  exportRate?: number;
  notes?: string;
  meterReset?: boolean;
};
