import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { DEFAULT_APP_SETTINGS } from '@/constants/defaults';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEYS, type StorageKey } from '@/constants/storageKeys';
import type { WattTrackBackup } from '@/types/backup';
import type { SystemCost } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import type { AppSettings } from '@/types/settings';
import type { SystemProfile } from '@/types/system';

const backupSchema = z.object({
  appName: z.literal('WattTrack'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  systemProfile: z.unknown().nullable(),
  energyReadings: z.array(z.unknown()),
  systemCosts: z.array(z.unknown()),
  appSettings: z.unknown(),
});

async function readJson<T>(key: StorageKey, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : fallback;
}

async function writeJson<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  async getSchemaVersion(): Promise<number> {
    return readJson<number>(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
  },
  async ensureSchemaVersion(): Promise<void> {
    await writeJson(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
  },
  getSystemProfile: () => readJson<SystemProfile | null>(STORAGE_KEYS.systemProfile, null),
  saveSystemProfile: (systemProfile: SystemProfile) => writeJson(STORAGE_KEYS.systemProfile, systemProfile),
  getEnergyReadings: () => readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, []),
  async saveEnergyReading(reading: EnergyReading): Promise<void> {
    const readings = await readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, []);
    await writeJson(STORAGE_KEYS.energyReadings, [reading, ...readings]);
  },
  setEnergyReadings: (readings: EnergyReading[]) => writeJson(STORAGE_KEYS.energyReadings, readings),
  async updateEnergyReading(updatedReading: EnergyReading): Promise<void> {
    const readings = await readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, []);
    await writeJson(
      STORAGE_KEYS.energyReadings,
      readings.map((reading) => (reading.id === updatedReading.id ? updatedReading : reading)),
    );
  },
  async deleteEnergyReading(readingId: string): Promise<void> {
    const readings = await readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, []);
    await writeJson(
      STORAGE_KEYS.energyReadings,
      readings.filter((reading) => reading.id !== readingId),
    );
  },
  getSystemCosts: () => readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, []),
  async saveSystemCost(cost: SystemCost): Promise<void> {
    const costs = await readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, []);
    await writeJson(STORAGE_KEYS.systemCosts, [cost, ...costs]);
  },
  async updateSystemCost(updatedCost: SystemCost): Promise<void> {
    const costs = await readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, []);
    await writeJson(
      STORAGE_KEYS.systemCosts,
      costs.map((cost) => (cost.id === updatedCost.id ? updatedCost : cost)),
    );
  },
  async deleteSystemCost(costId: string): Promise<void> {
    const costs = await readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, []);
    await writeJson(
      STORAGE_KEYS.systemCosts,
      costs.filter((cost) => cost.id !== costId),
    );
  },
  getAppSettings: () => readJson<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS),
  saveAppSettings: (settings: AppSettings) => writeJson(STORAGE_KEYS.appSettings, settings),
  async exportBackup(): Promise<WattTrackBackup> {
    const [systemProfile, energyReadings, systemCosts, appSettings] = await Promise.all([
      readJson<SystemProfile | null>(STORAGE_KEYS.systemProfile, null),
      readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, []),
      readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, []),
      readJson<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS),
    ]);

    return {
      appName: 'WattTrack',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      systemProfile,
      energyReadings,
      systemCosts,
      appSettings,
    };
  },
  async importBackup(payload: string | WattTrackBackup): Promise<WattTrackBackup> {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const backup = backupSchema.parse(parsed) as WattTrackBackup;

    await Promise.all([
      writeJson(STORAGE_KEYS.systemProfile, backup.systemProfile),
      writeJson(STORAGE_KEYS.energyReadings, backup.energyReadings),
      writeJson(STORAGE_KEYS.systemCosts, backup.systemCosts),
      writeJson(STORAGE_KEYS.appSettings, backup.appSettings),
      writeJson(STORAGE_KEYS.schemaVersion, backup.schemaVersion),
    ]);

    return backup;
  },
  async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.systemProfile),
      AsyncStorage.removeItem(STORAGE_KEYS.energyReadings),
      AsyncStorage.removeItem(STORAGE_KEYS.systemCosts),
      AsyncStorage.removeItem(STORAGE_KEYS.appSettings),
      AsyncStorage.removeItem(STORAGE_KEYS.schemaVersion),
    ]);
  },
};
