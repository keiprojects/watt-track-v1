import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { EnergyReading } from '@/types/reading';
import { sortReadingsDescending } from '@/utils/date';

type ReadingsState = {
  readings: EnergyReading[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setReadings: (readings: EnergyReading[]) => Promise<void>;
  saveReading: (reading: EnergyReading) => Promise<void>;
  updateReading: (reading: EnergyReading) => Promise<void>;
  deleteReading: (readingId: string) => Promise<void>;
};

export const useReadingsStore = create<ReadingsState>((set, get) => ({
  readings: [],
  hasHydrated: false,
  hydrate: async () => {
    const readings = await storageService.getEnergyReadings();
    set({ readings: sortReadingsDescending(readings), hasHydrated: true });
  },
  setReadings: async (readings) => {
    const sorted = sortReadingsDescending(readings);
    set({ readings: sorted });
    await storageService.setEnergyReadings(sorted);
  },
  saveReading: async (reading) => {
    const readings = sortReadingsDescending([reading, ...get().readings]);
    set({ readings });
    await storageService.setEnergyReadings(readings);
  },
  updateReading: async (reading) => {
    const readings = sortReadingsDescending(
      get().readings.map((currentReading) => (currentReading.id === reading.id ? reading : currentReading)),
    );
    set({ readings });
    await storageService.setEnergyReadings(readings);
  },
  deleteReading: async (readingId) => {
    const readings = get().readings.filter((reading) => reading.id !== readingId);
    set({ readings });
    await storageService.setEnergyReadings(readings);
  },
}));
