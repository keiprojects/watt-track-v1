import { z } from 'zod';

import { CURRENT_SCHEMA_VERSION } from '@/constants/storageKeys';

export const readingInputModeSchema = z.enum(['daily', 'cumulative']);
export const exportInputModeSchema = z.enum(['disabled', 'daily', 'cumulative']);
export const warningCodeSchema = z.enum([
  'cumulative-lower-than-prior',
  'unusually-high-solar',
  'export-higher-than-solar',
  'zero-electricity-rate',
]);
export const systemCostCategorySchema = z.enum(['installation', 'maintenance', 'repair', 'upgrade', 'other']);
export const costTreatmentSchema = z.enum(['capital', 'maintenance']);
export const appThemeSchema = z.enum(['system', 'light', 'dark']);
export const dashboardPeriodSchema = z.enum(['7d', '30d', 'month', 'year', 'all']);
export const schemaVersionSchema = z
  .number()
  .int()
  .min(1)
  .max(CURRENT_SCHEMA_VERSION, `Backups from newer schema versions than ${CURRENT_SCHEMA_VERSION} are not supported yet.`);

export const systemProfileSchema = z.object({
  id: z.string().min(1),
  systemName: z.string().min(1),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
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

export const energyReadingSchema = z.object({
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

export const systemCostSchema = z.object({
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

export const billingCycleOverrideSchema = z.object({
  id: z.string().min(1),
  anchorCycleStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cycleStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cycleEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  importRate: z.number().min(0).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const appSettingsSchema = z
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

export const backupSchema = z.object({
  appName: z.literal('WattTrack'),
  schemaVersion: schemaVersionSchema,
  exportedAt: z.string(),
  systemProfile: systemProfileSchema.nullable(),
  energyReadings: z.array(energyReadingSchema),
  systemCosts: z.array(systemCostSchema),
  billingCycleOverrides: z.array(billingCycleOverrideSchema).optional().default([]),
  appSettings: appSettingsSchema,
});

export const localBackupSnapshotSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  summary: z.string().min(1),
  backup: backupSchema,
});
