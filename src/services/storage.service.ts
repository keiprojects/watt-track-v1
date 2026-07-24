import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { DEFAULT_APP_SETTINGS } from '@/constants/defaults';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEYS, type StorageKey } from '@/constants/storageKeys';
import {
  appSettingsSchema,
  backupSchema,
  billingCycleOverrideSchema,
  energyReadingSchema,
  localBackupSnapshotSchema,
  schemaVersionSchema,
  systemCostSchema,
  systemProfileSchema,
} from '@/schemas/storage.schemas';
import type { LocalBackupSnapshot, WattTrackBackup } from '@/types/backup';
import type { BillingCycleOverride } from '@/types/billing';
import type { SystemCost } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import type { AppSettings } from '@/types/settings';
import type { SystemProfile } from '@/types/system';

const MAX_LOCAL_BACKUPS = 8;

type RestoreMode = 'replace' | 'merge';

function summarizeBackup(backup: WattTrackBackup): string {
  return `${backup.energyReadings.length} readings | ${backup.systemCosts.length} costs | ${backup.billingCycleOverrides?.length ?? 0} bill cycles | ${backup.systemProfile ? '1 profile' : '0 profiles'}`;
}

function mergeByNewestUpdatedAt<T extends { id: string; updatedAt: string }>(backupItems: T[], localItems: T[]): T[] {
  const mergedById = new Map<string, T>();

  for (const item of backupItems) {
    mergedById.set(item.id, item);
  }

  for (const item of localItems) {
    const existing = mergedById.get(item.id);
    if (!existing || item.updatedAt.localeCompare(existing.updatedAt) >= 0) {
      mergedById.set(item.id, item);
    }
  }

  return Array.from(mergedById.values());
}

function mergeSystemProfile(backupProfile: SystemProfile | null, localProfile: SystemProfile | null): SystemProfile | null {
  if (!backupProfile) {
    return localProfile;
  }

  if (!localProfile) {
    return backupProfile;
  }

  return localProfile.updatedAt.localeCompare(backupProfile.updatedAt) >= 0 ? localProfile : backupProfile;
}

async function readJson<T>(key: StorageKey, fallback: T, schema?: z.ZodType<T>): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!schema) {
      return parsed as T;
    }

    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
  } catch {
    // Fall back below after clearing the invalid local value.
  }

  await AsyncStorage.removeItem(key).catch(() => {
    // Ignore cleanup failures and continue booting with defaults.
  });
  return fallback;
}

async function writeJson<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  async getSchemaVersion(): Promise<number> {
    return readJson<number>(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION, schemaVersionSchema);
  },
  async ensureSchemaVersion(): Promise<void> {
    await writeJson(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
  },
  getSystemProfile: () => readJson<SystemProfile | null>(STORAGE_KEYS.systemProfile, null, systemProfileSchema.nullable()),
  saveSystemProfile: (systemProfile: SystemProfile) => writeJson(STORAGE_KEYS.systemProfile, systemProfile),
  getEnergyReadings: () => readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, [], z.array(energyReadingSchema)),
  async saveEnergyReading(reading: EnergyReading): Promise<void> {
    const readings = await readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, [], z.array(energyReadingSchema));
    await writeJson(STORAGE_KEYS.energyReadings, [reading, ...readings]);
  },
  setEnergyReadings: (readings: EnergyReading[]) => writeJson(STORAGE_KEYS.energyReadings, readings),
  async updateEnergyReading(updatedReading: EnergyReading): Promise<void> {
    const readings = await readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, [], z.array(energyReadingSchema));
    await writeJson(
      STORAGE_KEYS.energyReadings,
      readings.map((reading) => (reading.id === updatedReading.id ? updatedReading : reading)),
    );
  },
  async deleteEnergyReading(readingId: string): Promise<void> {
    const readings = await readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, [], z.array(energyReadingSchema));
    await writeJson(
      STORAGE_KEYS.energyReadings,
      readings.filter((reading) => reading.id !== readingId),
    );
  },
  getSystemCosts: () => readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, [], z.array(systemCostSchema)),
  async saveSystemCost(cost: SystemCost): Promise<void> {
    const costs = await readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, [], z.array(systemCostSchema));
    await writeJson(STORAGE_KEYS.systemCosts, [cost, ...costs]);
  },
  async updateSystemCost(updatedCost: SystemCost): Promise<void> {
    const costs = await readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, [], z.array(systemCostSchema));
    await writeJson(
      STORAGE_KEYS.systemCosts,
      costs.map((cost) => (cost.id === updatedCost.id ? updatedCost : cost)),
    );
  },
  async deleteSystemCost(costId: string): Promise<void> {
    const costs = await readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, [], z.array(systemCostSchema));
    await writeJson(
      STORAGE_KEYS.systemCosts,
      costs.filter((cost) => cost.id !== costId),
    );
  },
  getBillingCycleOverrides: () => readJson<BillingCycleOverride[]>(STORAGE_KEYS.billingCycleOverrides, [], z.array(billingCycleOverrideSchema)),
  async saveBillingCycleOverride(cycleOverride: BillingCycleOverride): Promise<void> {
    const cycleOverrides = await readJson<BillingCycleOverride[]>(STORAGE_KEYS.billingCycleOverrides, [], z.array(billingCycleOverrideSchema));
    await writeJson(
      STORAGE_KEYS.billingCycleOverrides,
      [
        cycleOverride,
        ...cycleOverrides.filter((override) => override.id !== cycleOverride.id && override.anchorCycleStartDate !== cycleOverride.anchorCycleStartDate),
      ],
    );
  },
  async updateBillingCycleOverride(updatedOverride: BillingCycleOverride): Promise<void> {
    const cycleOverrides = await readJson<BillingCycleOverride[]>(STORAGE_KEYS.billingCycleOverrides, [], z.array(billingCycleOverrideSchema));
    await writeJson(
      STORAGE_KEYS.billingCycleOverrides,
      cycleOverrides.map((override) => (override.id === updatedOverride.id ? updatedOverride : override)),
    );
  },
  async deleteBillingCycleOverride(overrideId: string): Promise<void> {
    const cycleOverrides = await readJson<BillingCycleOverride[]>(STORAGE_KEYS.billingCycleOverrides, [], z.array(billingCycleOverrideSchema));
    await writeJson(
      STORAGE_KEYS.billingCycleOverrides,
      cycleOverrides.filter((override) => override.id !== overrideId),
    );
  },
  getAppSettings: () => readJson<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS, appSettingsSchema),
  saveAppSettings: (settings: AppSettings) => writeJson(STORAGE_KEYS.appSettings, settings),
  async exportBackup(): Promise<WattTrackBackup> {
    const [systemProfile, energyReadings, systemCosts, billingCycleOverrides, appSettings] = await Promise.all([
      readJson<SystemProfile | null>(STORAGE_KEYS.systemProfile, null, systemProfileSchema.nullable()),
      readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, [], z.array(energyReadingSchema)),
      readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, [], z.array(systemCostSchema)),
      readJson<BillingCycleOverride[]>(STORAGE_KEYS.billingCycleOverrides, [], z.array(billingCycleOverrideSchema)),
      readJson<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS, appSettingsSchema),
    ]);

    return {
      appName: 'WattTrack',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      systemProfile,
      energyReadings,
      systemCosts,
      billingCycleOverrides,
      appSettings,
    };
  },
  async getLocalBackups(): Promise<LocalBackupSnapshot[]> {
    return readJson<LocalBackupSnapshot[]>(STORAGE_KEYS.localBackups, [], z.array(localBackupSnapshotSchema));
  },
  async createLocalBackup(): Promise<LocalBackupSnapshot> {
    const backup = await storageService.exportBackup();
    const snapshot: LocalBackupSnapshot = {
      id: backup.exportedAt,
      createdAt: backup.exportedAt,
      summary: summarizeBackup(backup),
      backup,
    };
    const existingBackups = await storageService.getLocalBackups();
    await writeJson(STORAGE_KEYS.localBackups, [snapshot, ...existingBackups].slice(0, MAX_LOCAL_BACKUPS));
    return snapshot;
  },
  async importBackup(payload: string | WattTrackBackup, mode: RestoreMode = 'replace'): Promise<WattTrackBackup> {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const backup = backupSchema.parse(parsed) as WattTrackBackup;
    const backupToRestore =
      mode === 'merge'
        ? {
            appName: 'WattTrack' as const,
            schemaVersion: CURRENT_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            systemProfile: mergeSystemProfile(backup.systemProfile, await storageService.getSystemProfile()),
            energyReadings: mergeByNewestUpdatedAt(backup.energyReadings, await storageService.getEnergyReadings()),
            systemCosts: mergeByNewestUpdatedAt(backup.systemCosts, await storageService.getSystemCosts()),
            billingCycleOverrides: mergeByNewestUpdatedAt(backup.billingCycleOverrides ?? [], await storageService.getBillingCycleOverrides()),
            appSettings: await storageService.getAppSettings(),
          }
        : backup;

    await Promise.all([
      writeJson(STORAGE_KEYS.systemProfile, backupToRestore.systemProfile),
      writeJson(STORAGE_KEYS.energyReadings, backupToRestore.energyReadings),
      writeJson(STORAGE_KEYS.systemCosts, backupToRestore.systemCosts),
      writeJson(STORAGE_KEYS.billingCycleOverrides, backupToRestore.billingCycleOverrides ?? []),
      writeJson(STORAGE_KEYS.appSettings, backupToRestore.appSettings),
      writeJson(STORAGE_KEYS.schemaVersion, backupToRestore.schemaVersion),
    ]);

    return backupToRestore;
  },
  async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.systemProfile),
      AsyncStorage.removeItem(STORAGE_KEYS.energyReadings),
      AsyncStorage.removeItem(STORAGE_KEYS.systemCosts),
      AsyncStorage.removeItem(STORAGE_KEYS.billingCycleOverrides),
      AsyncStorage.removeItem(STORAGE_KEYS.appSettings),
      AsyncStorage.removeItem(STORAGE_KEYS.schemaVersion),
      AsyncStorage.removeItem(STORAGE_KEYS.localBackups),
    ]);
  },
};
