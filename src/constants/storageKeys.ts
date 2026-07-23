export const STORAGE_KEYS = {
  systemProfile: 'watttrack.systemProfile',
  energyReadings: 'watttrack.energyReadings',
  systemCosts: 'watttrack.systemCosts',
  billingCycleOverrides: 'watttrack.billingCycleOverrides',
  appSettings: 'watttrack.appSettings',
  schemaVersion: 'watttrack.schemaVersion',
  localBackups: 'watttrack.localBackups',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const CURRENT_SCHEMA_VERSION = 2;
