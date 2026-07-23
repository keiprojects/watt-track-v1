import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { BillingCycleOverride } from '@/types/billing';

function sortOverridesDescending(overrides: BillingCycleOverride[]): BillingCycleOverride[] {
  return [...overrides].sort((left, right) => right.anchorCycleStartDate.localeCompare(left.anchorCycleStartDate));
}

type BillingCyclesState = {
  cycleOverrides: BillingCycleOverride[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  saveCycleOverride: (cycleOverride: BillingCycleOverride) => Promise<void>;
  deleteCycleOverride: (overrideId: string) => Promise<void>;
};

export const useBillingCyclesStore = create<BillingCyclesState>((set, get) => ({
  cycleOverrides: [],
  hasHydrated: false,
  hydrate: async () => {
    try {
      const cycleOverrides = await storageService.getBillingCycleOverrides();
      set({ cycleOverrides: sortOverridesDescending(cycleOverrides), hasHydrated: true });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to hydrate billing cycle store.', error);
      }

      set({ cycleOverrides: [], hasHydrated: true });
    }
  },
  saveCycleOverride: async (cycleOverride) => {
    const cycleOverrides = sortOverridesDescending([
      cycleOverride,
      ...get().cycleOverrides.filter((override) => override.anchorCycleStartDate !== cycleOverride.anchorCycleStartDate),
    ]);
    set({ cycleOverrides });
    await storageService.saveBillingCycleOverride(cycleOverride);
  },
  deleteCycleOverride: async (overrideId) => {
    const cycleOverrides = get().cycleOverrides.filter((override) => override.id !== overrideId);
    set({ cycleOverrides });
    await storageService.deleteBillingCycleOverride(overrideId);
  },
}));
