import type { AppSettings } from '@/types/settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  decimalPlaces: 2,
  defaultDashboardPeriod: '30d',
  reminderEnabled: false,
  onboardingCompleted: false,
};
