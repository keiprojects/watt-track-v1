import { create } from 'zustand';

import { recalculateReadings } from '@/services/calculation.service';
import { storageService } from '@/services/storage.service';
import { useReadingsStore } from '@/stores/readings.store';
import type { SystemProfile } from '@/types/system';
import { sortReadingsDescending } from '@/utils/date';

type SystemState = {
  systemProfile: SystemProfile | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  saveProfile: (profile: SystemProfile) => Promise<void>;
};

export const useSystemStore = create<SystemState>((set) => ({
  systemProfile: null,
  hasHydrated: false,
  hydrate: async () => {
    try {
      const systemProfile = await storageService.getSystemProfile();
      set({ systemProfile, hasHydrated: true });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to hydrate system store.', error);
      }

      set({ systemProfile: null, hasHydrated: true });
    }
  },
  saveProfile: async (profile) => {
    const previousSystemProfile = useSystemStore.getState().systemProfile;
    const existingReadings = useReadingsStore.getState().readings;
    const recalculatedReadings = sortReadingsDescending(recalculateReadings({ readings: existingReadings, profile }));

    set({ systemProfile: profile });
    useReadingsStore.setState({ readings: recalculatedReadings });

    try {
      await Promise.all([
        storageService.saveSystemProfile(profile),
        storageService.setEnergyReadings(recalculatedReadings),
      ]);
    } catch (error) {
      set({ systemProfile: previousSystemProfile });
      useReadingsStore.setState({ readings: existingReadings });
      throw error;
    }
  },
}));
