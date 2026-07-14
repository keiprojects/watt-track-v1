import { create } from 'zustand';

import { DEFAULT_APP_SETTINGS } from '@/constants/defaults';
import { storageService } from '@/services/storage.service';
import type { AppSettings } from '@/types/settings';

type SettingsState = {
  settings: AppSettings;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_APP_SETTINGS,
  hasHydrated: false,
  hydrate: async () => {
    await storageService.ensureSchemaVersion();
    const settings = await storageService.getAppSettings();
    set({ settings, hasHydrated: true });
  },
  saveSettings: async (settings) => {
    set({ settings });
    await storageService.saveAppSettings(settings);
  },
  updateSettings: async (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    await storageService.saveAppSettings(settings);
  },
  completeOnboarding: async () => {
    const settings = { ...get().settings, onboardingCompleted: true };
    set({ settings });
    await storageService.saveAppSettings(settings);
  },
}));
