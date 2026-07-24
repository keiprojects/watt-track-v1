import { create } from 'zustand';

import { recalculateReadings } from '@/services/calculation.service';
import { storageService } from '@/services/storage.service';
import { persistOptimisticState } from '@/stores/persistence';
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
    const previousReadings = get().readings;
    const sorted = sortReadingsDescending(readings);
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { readings: previousReadings },
      nextState: { readings: sorted },
      persist: () => storageService.setEnergyReadings(sorted),
    });
  },
  saveReading: async (reading, profile) => {
    const previousReadings = get().readings;
    const readings = sortReadingsDescending(recalculateReadings({ readings: [reading, ...get().readings], profile }));
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { readings: previousReadings },
      nextState: { readings },
      persist: () => storageService.setEnergyReadings(readings),
    });
  },
  updateReading: async (reading, profile) => {
    const previousReadings = get().readings;
    const readings = sortReadingsDescending(
      recalculateReadings({
        readings: get().readings.map((currentReading) => (currentReading.id === reading.id ? reading : currentReading)),
        profile,
      }),
    );
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { readings: previousReadings },
      nextState: { readings },
      persist: () => storageService.setEnergyReadings(readings),
    });
  },
  deleteReading: async (readingId, profile) => {
    const previousReadings = get().readings;
    const readings = sortReadingsDescending(
      recalculateReadings({
        readings: get().readings.filter((reading) => reading.id !== readingId),
        profile,
      }),
    );
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { readings: previousReadings },
      nextState: { readings },
      persist: () => storageService.setEnergyReadings(readings),
    });
  },
}));
