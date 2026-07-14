import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { EnergyReading } from '@/types/reading';

type ReadingsState = {
  readings: EnergyReading[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  addReading: (reading: EnergyReading) => Promise<void>;
};

export const useReadingsStore = create<ReadingsState>((set, get) => ({
  readings: [],
  hasHydrated: false,
  hydrate: async () => {
    const readings = await storageService.getReadings();
    set({ readings, hasHydrated: true });
  },
  addReading: async (reading) => {
    const readings = [reading, ...get().readings];
    set({ readings });
    await storageService.setReadings(readings);
  },
}));
