import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS, type StorageKey } from '@/constants/storageKeys';
import type { CostSettings } from '@/types/cost';
import type { EnergyReading } from '@/types/reading';
import type { EnergySystem } from '@/types/system';

async function readJson<T>(key: StorageKey, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : fallback;
}

async function writeJson<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storageService = {
  getOnboardingCompleted: () => readJson<boolean>(STORAGE_KEYS.onboardingCompleted, false),
  setOnboardingCompleted: (completed: boolean) => writeJson(STORAGE_KEYS.onboardingCompleted, completed),
  getSystems: () => readJson<EnergySystem[]>(STORAGE_KEYS.systems, []),
  setSystems: (systems: EnergySystem[]) => writeJson(STORAGE_KEYS.systems, systems),
  getReadings: () => readJson<EnergyReading[]>(STORAGE_KEYS.readings, []),
  setReadings: (readings: EnergyReading[]) => writeJson(STORAGE_KEYS.readings, readings),
  getCostSettings: () => readJson<CostSettings>(STORAGE_KEYS.costSettings, { currencyCode: 'USD', ratePerKwh: 0.16 }),
  setCostSettings: (settings: CostSettings) => writeJson(STORAGE_KEYS.costSettings, settings),
};
