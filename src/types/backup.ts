import type { BillingCycleOverride } from '@/types/billing';
import type { SystemCost } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import type { AppSettings } from '@/types/settings';
import type { SystemProfile } from '@/types/system';

export type WattTrackBackup = {
  appName: 'WattTrack';
  schemaVersion: number;
  exportedAt: string;
  systemProfile: SystemProfile | null;
  energyReadings: EnergyReading[];
  systemCosts: SystemCost[];
  billingCycleOverrides?: BillingCycleOverride[];
  appSettings: AppSettings;
};

export type LocalBackupSnapshot = {
  id: string;
  createdAt: string;
  summary: string;
  backup: WattTrackBackup;
};
