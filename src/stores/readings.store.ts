import { create } from 'zustand';

import { recalculateReadings } from '@/services/calculation.service';
import { storageService } from '@/services/storage.service';
import type { EnergyReading } from '@/types/reading';
import type { SystemProfile } from '@/types/system';
import { sortReadingsDescending } from '@/utils/date';

type ReadingsState = {
  readings: EnergyReading[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setReadings: (readings: EnergyReading[]) => Promise<void>;
  saveReading: (reading: EnergyReading, profile: SystemProfile) => Promise<void>;
  updateReading: (reading: EnergyReading, profile: SystemProfile) => Promise<void>;
  deleteReading: (readingId: string, profile: SystemProfile) => Promise<void>;
};

export const useReadingsStore = create<ReadingsState>((set, get) => ({
  readings: [],
  hasHydrated: false,
  hydrate: async () => {
    try {
      const readings = await storageService.getEnergyReadings();
      set({ readings: sortReadingsDescending(readings), hasHydrated: true });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to hydrate readings store.', error);
      }

      set({ readings: [], hasHydrated: true });
    }
  },
  setReadings: async (readings) => {
    const sorted = sortReadingsDescending(readings);
    set({ readings: sorted });
    await storageService.setEnergyReadings(sorted);
  },
  saveReading: async (reading, profile) => {
    const readings = sortReadingsDescending(recalculateReadings({ readings: [reading, ...get().readings], profile }));
    set({ readings });
    await storageService.setEnergyReadings(readings);
  },
  updateReading: async (reading, profile) => {
    const readings = sortReadingsDescending(
      recalculateReadings({
        readings: get().readings.map((currentReading) => (currentReading.id === reading.id ? reading : currentReading)),
        profile,
      }),
    );
    set({ readings });
    await storageService.setEnergyReadings(readings);
  },
  deleteReading: async (readingId, profile) => {
    const readings = sortReadingsDescending(
      recalculateReadings({
        readings: get().readings.filter((reading) => reading.id !== readingId),
        profile,
      }),
    );
    set({ readings });
    await storageService.setEnergyReadings(readings);
  },
}));
