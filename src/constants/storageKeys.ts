export const STORAGE_KEYS = {
  onboardingCompleted: '@watt-track/onboarding-completed',
  systems: '@watt-track/systems',
  readings: '@watt-track/readings',
  costSettings: '@watt-track/cost-settings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
