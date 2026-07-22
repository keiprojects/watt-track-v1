import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CURRENT_SCHEMA_VERSION, STORAGE_KEYS } from '@/constants/storageKeys';
import type { WattTrackBackup } from '@/types/backup';
import type { EnergyReading } from '@/types/reading';
import type { AppSettings } from '@/types/settings';
import type { SystemProfile } from '@/types/system';

const asyncStorage = vi.hoisted(() => ({
  values: new Map<string, string>(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStorage.values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStorage.values.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      asyncStorage.values.delete(key);
    }),
  },
}));

const { storageService } = await import('./storage.service');

const timestamp = '2026-07-22T00:00:00.000Z';

const settings: AppSettings = {
  theme: 'system',
  decimalPlaces: 2,
  defaultDashboardPeriod: '30d',
  reminderEnabled: false,
  onboardingCompleted: true,
};

const profile: SystemProfile = {
  id: 'system-1',
  systemName: 'QA Solar',
  installationDate: '2026-01-01',
  currency: 'PHP',
  timezone: 'Asia/Manila',
  initialSystemCost: 150000,
  defaultImportRate: 12,
  billingCycleStartDay: 1,
  gridInputMode: 'cumulative',
  solarInputMode: 'cumulative',
  exportInputMode: 'disabled',
  createdAt: timestamp,
  updatedAt: timestamp,
};

function reading(overrides: Partial<EnergyReading>): EnergyReading {
  return {
    id: 'reading-1',
    date: '2026-07-22',
    gridReading: 100,
    gridConsumptionKwh: 10,
    solarReading: 200,
    solarGenerationKwh: 20,
    exportedEnergyKwh: 0,
    selfConsumedSolarKwh: 20,
    estimatedHomeUsageKwh: 30,
    importRate: 12,
    estimatedSavings: 240,
    estimatedGridCost: 120,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function backup(overrides: Partial<WattTrackBackup> = {}): WattTrackBackup {
  return {
    appName: 'WattTrack',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: timestamp,
    systemProfile: profile,
    energyReadings: [reading({})],
    systemCosts: [],
    appSettings: settings,
    ...overrides,
  };
}

describe('storageService backup import', () => {
  beforeEach(() => {
    asyncStorage.values.clear();
  });

  it('rejects backups from newer schema versions', async () => {
    await expect(storageService.importBackup(backup({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 }))).rejects.toThrow(
      /newer schema versions/,
    );
  });

  it('replaces local data with a validated backup', async () => {
    const imported = await storageService.importBackup(backup());

    expect(imported.systemProfile?.systemName).toBe('QA Solar');
    expect(await storageService.getSystemProfile()).toEqual(profile);
    expect(await storageService.getEnergyReadings()).toHaveLength(1);
    expect(await storageService.getAppSettings()).toEqual(settings);
    expect(asyncStorage.values.get(STORAGE_KEYS.schemaVersion)).toBe(String(CURRENT_SCHEMA_VERSION));
  });

  it('merges records by newest update timestamp and preserves local settings', async () => {
    const localSettings: AppSettings = {
      ...settings,
      theme: 'dark',
    };
    const localReading = reading({
      id: 'shared-reading',
      date: '2026-07-22',
      estimatedSavings: 999,
      updatedAt: '2026-07-23T00:00:00.000Z',
    });

    asyncStorage.values.set(STORAGE_KEYS.appSettings, JSON.stringify(localSettings));
    asyncStorage.values.set(STORAGE_KEYS.energyReadings, JSON.stringify([localReading]));
    asyncStorage.values.set(STORAGE_KEYS.systemCosts, JSON.stringify([]));
    asyncStorage.values.set(STORAGE_KEYS.systemProfile, JSON.stringify(profile));

    const merged = await storageService.importBackup(
      backup({
        energyReadings: [
          reading({
            id: 'shared-reading',
            date: '2026-07-22',
            estimatedSavings: 100,
            updatedAt: '2026-07-22T00:00:00.000Z',
          }),
          reading({ id: 'backup-only', date: '2026-07-21' }),
        ],
      }),
      'merge',
    );

    expect(merged.appSettings).toEqual(localSettings);
    expect(merged.energyReadings).toHaveLength(2);
    expect(merged.energyReadings.find((entry) => entry.id === 'shared-reading')?.estimatedSavings).toBe(999);
  });
});
