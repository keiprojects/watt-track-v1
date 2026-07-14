export type DashboardPeriod = '7d' | '30d' | 'month' | 'year' | 'all';
export type AppTheme = 'system' | 'light' | 'dark';

export type AppSettings = {
  theme: AppTheme;
  decimalPlaces: number;
  defaultDashboardPeriod: DashboardPeriod;
  reminderEnabled: boolean;
  reminderTime?: string;
  onboardingCompleted: boolean;
};
