import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { DEFAULT_APP_SETTINGS } from '@/constants/defaults';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEYS, type StorageKey } from '@/constants/storageKeys';
import type { WattTrackBackup } from '@/types/backup';
import type { SystemCost } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import type { AppSettings } from '@/types/settings';
import type { SystemProfile } from '@/types/system';

const readingInputModeSchema = z.enum(['daily', 'cumulative']);
const exportInputModeSchema = z.enum(['disabled', 'daily', 'cumulative']);
const warningCodeSchema = z.enum([
  'cumulative-lower-than-prior',
  'unusually-high-solar',
  'export-higher-than-solar',
  'zero-electricity-rate',
]);
const systemCostCategorySchema = z.enum(['installation', 'maintenance', 'repair', 'upgrade', 'other']);
const costTreatmentSchema = z.enum(['capital', 'maintenance']);
const appThemeSchema = z.enum(['system', 'light', 'dark']);
const dashboardPeriodSchema = z.enum(['7d', '30d', 'month', 'year', 'all']);
const schemaVersionSchema = z
  .number()
  .int()
  .min(1)
  .max(CURRENT_SCHEMA_VERSION, `Backups from newer schema versions than ${CURRENT_SCHEMA_VERSION} are not supported yet.`);

const systemProfileSchema = z.object({
  id: z.string().min(1),
  systemName: z.string().min(1),
  location: z.string().optional(),
  installationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.literal('PHP'),
  timezone: z.string().min(1),
  solarCapacityKw: z.number().min(0).optional(),
  inverterCapacityKw: z.number().min(0).optional(),
  batteryCapacityKwh: z.number().min(0).optional(),
  initialSystemCost: z.number().min(0),
  defaultImportRate: z.number().min(0),
  defaultExportRate: z.number().min(0).optional(),
  billingCycleStartDay: z.number().int().min(1).max(31).default(1),
  gridInputMode: readingInputModeSchema,
  solarInputMode: readingInputModeSchema,
  exportInputMode: exportInputModeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const energyReadingSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  gridReading: z.number().min(0).optional(),
  gridConsumptionKwh: z.number().min(0),
  solarReading: z.number().min(0).optional(),
  solarGenerationKwh: z.number().min(0),
  exportReading: z.number().min(0).optional(),
  exportedEnergyKwh: z.number().min(0),
  selfConsumedSolarKwh: z.number().min(0),
  estimatedHomeUsageKwh: z.number().min(0),
  importRate: z.number().min(0),
  exportRate: z.number().min(0).optional(),
  estimatedSavings: z.number().min(0),
  estimatedGridCost: z.number().min(0),
  notes: z.string().optional(),
  meterReset: z.boolean().optional(),
  warningCodes: z.array(warningCodeSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const systemCostSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: systemCostCategorySchema,
  description: z.string().min(1),
  amount: z.number().min(0),
  costTreatment: costTreatmentSchema,
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const appSettingsSchema = z
  .object({
    theme: appThemeSchema,
    decimalPlaces: z.number().int().min(0).max(3),
    defaultDashboardPeriod: dashboardPeriodSchema,
    reminderEnabled: z.boolean(),
    reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    onboardingCompleted: z.boolean(),
  })
  .refine((settings) => !settings.reminderEnabled || Boolean(settings.reminderTime), {
    message: 'Enabled reminders must include a reminder time.',
    path: ['reminderTime'],
  });

const backupSchema = z.object({
  appName: z.literal('WattTrack'),
  schemaVersion: schemaVersionSchema,
  exportedAt: z.string(),
  systemProfile: systemProfileSchema.nullable(),
  energyReadings: z.array(energyReadingSchema),
  systemCosts: z.array(systemCostSchema),
  appSettings: appSettingsSchema,
});

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
  getAppSettings: () => readJson<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS, appSettingsSchema),
  saveAppSettings: (settings: AppSettings) => writeJson(STORAGE_KEYS.appSettings, settings),
  async exportBackup(): Promise<WattTrackBackup> {
    const [systemProfile, energyReadings, systemCosts, appSettings] = await Promise.all([
      readJson<SystemProfile | null>(STORAGE_KEYS.systemProfile, null, systemProfileSchema.nullable()),
      readJson<EnergyReading[]>(STORAGE_KEYS.energyReadings, [], z.array(energyReadingSchema)),
      readJson<SystemCost[]>(STORAGE_KEYS.systemCosts, [], z.array(systemCostSchema)),
      readJson<AppSettings>(STORAGE_KEYS.appSettings, DEFAULT_APP_SETTINGS, appSettingsSchema),
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
