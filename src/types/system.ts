export type ReadingInputMode = 'daily' | 'cumulative';
export type ExportInputMode = 'disabled' | 'daily' | 'cumulative';

export type SystemProfile = {
  id: string;
  systemName: string;
  location?: string;
  installationDate: string;
  currency: 'PHP';
  timezone: string;
  solarCapacityKw?: number;
  inverterCapacityKw?: number;
  batteryCapacityKwh?: number;
  initialSystemCost: number;
  defaultImportRate: number;
  defaultExportRate?: number;
  billingCycleStartDay: number;
  gridInputMode: ReadingInputMode;
  solarInputMode: ReadingInputMode;
  exportInputMode: ExportInputMode;
  createdAt: string;
  updatedAt: string;
};
