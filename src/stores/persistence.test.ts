import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_APP_SETTINGS } from '@/constants/defaults';
import type { EnergyReading } from '@/types/reading';
import type { SystemProfile } from '@/types/system';

const storageMocks = vi.hoisted(() => ({
  setEnergyReadings: vi.fn(),
  saveAppSettings: vi.fn(),
  saveSystemProfile: vi.fn(),
}));

vi.mock('@/services/storage.service', () => ({
  storageService: {
    setEnergyReadings: storageMocks.setEnergyReadings,
    saveAppSettings: storageMocks.saveAppSettings,
    saveSystemProfile: storageMocks.saveSystemProfile,
  },
}));

const { useReadingsStore } = await import('./readings.store');
const { useSettingsStore } = await import('./settings.store');
const { useSystemStore } = await import('./system.store');

const timestamp = '2026-07-24T00:00:00.000Z';

const profile: SystemProfile = {
  id: 'system-1',
  systemName: 'QA Solar',
  installationDate: '2026-01-01',
  currency: 'PHP',
  timezone: 'Asia/Manila',
  initialSystemCost: 150000,
  defaultImportRate: 12,
  billingCycleStartDay: 1,
  gridInputMode: 'daily',
  solarInputMode: 'daily',
  exportInputMode: 'disabled',
  createdAt: timestamp,
  updatedAt: timestamp,
};

function reading(overrides: Partial<EnergyReading>): EnergyReading {
  return {
    id: 'reading-1',
    date: '2026-07-24',
    gridReading: 10,
    gridConsumptionKwh: 10,
    solarReading: 20,
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

describe('store persistence rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.setEnergyReadings.mockResolvedValue(undefined);
    storageMocks.saveAppSettings.mockResolvedValue(undefined);
    storageMocks.saveSystemProfile.mockResolvedValue(undefined);
    useReadingsStore.setState({ readings: [], hasHydrated: false });
    useSettingsStore.setState({ settings: DEFAULT_APP_SETTINGS, hasHydrated: false });
    useSystemStore.setState({ systemProfile: null, hasHydrated: false });
  });

  it('rolls back readings when saving to storage fails', async () => {
    const existingReading = reading({ id: 'existing', date: '2026-07-23' });
    const nextReading = reading({ id: 'next', date: '2026-07-24' });

    useReadingsStore.setState({ readings: [existingReading], hasHydrated: true });
    storageMocks.setEnergyReadings.mockRejectedValueOnce(new Error('AsyncStorage write failed'));

    await expect(useReadingsStore.getState().saveReading(nextReading, profile)).rejects.toThrow('AsyncStorage write failed');

    expect(useReadingsStore.getState().readings).toEqual([existingReading]);
  });

  it('rolls back settings when saving to storage fails', async () => {
    const originalSettings = { ...DEFAULT_APP_SETTINGS, theme: 'light' as const };

    useSettingsStore.setState({ settings: originalSettings, hasHydrated: true });
    storageMocks.saveAppSettings.mockRejectedValueOnce(new Error('AsyncStorage write failed'));

    await expect(useSettingsStore.getState().updateSettings({ theme: 'dark' })).rejects.toThrow('AsyncStorage write failed');

    expect(useSettingsStore.getState().settings).toEqual(originalSettings);
  });

  it('rolls back profile and recalculated readings when profile persistence fails', async () => {
    const existingReading = reading({ id: 'existing', date: '2026-07-23' });

    useSystemStore.setState({ systemProfile: profile, hasHydrated: true });
    useReadingsStore.setState({ readings: [existingReading], hasHydrated: true });
    storageMocks.saveSystemProfile.mockRejectedValueOnce(new Error('AsyncStorage write failed'));

    await expect(
      useSystemStore.getState().saveProfile({
        ...profile,
        systemName: 'Updated Solar',
        updatedAt: '2026-07-24T01:00:00.000Z',
      }),
    ).rejects.toThrow('AsyncStorage write failed');

    expect(useSystemStore.getState().systemProfile).toEqual(profile);
    expect(useReadingsStore.getState().readings).toEqual([existingReading]);
  });
});
