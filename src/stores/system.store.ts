import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { SystemProfile } from '@/types/system';

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
    const systemProfile = await storageService.getSystemProfile();
    set({ systemProfile, hasHydrated: true });
  },
  saveProfile: async (profile) => {
    set({ systemProfile: profile });
    await storageService.saveSystemProfile(profile);
  },
}));
