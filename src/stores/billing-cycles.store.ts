import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import { persistOptimisticState } from '@/stores/persistence';
import type { BillingCycleOverride } from '@/types/billing';
import { sortBillingCycleOverridesDescending } from '@/utils/domainSort';

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
      set({ cycleOverrides: sortBillingCycleOverridesDescending(cycleOverrides), hasHydrated: true });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to hydrate billing cycle store.', error);
      }

      set({ cycleOverrides: [], hasHydrated: true });
    }
  },
  saveCycleOverride: async (cycleOverride) => {
    const previousCycleOverrides = get().cycleOverrides;
    const cycleOverrides = sortBillingCycleOverridesDescending([
      cycleOverride,
      ...get().cycleOverrides.filter((override) => override.anchorCycleStartDate !== cycleOverride.anchorCycleStartDate),
    ]);
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { cycleOverrides: previousCycleOverrides },
      nextState: { cycleOverrides },
      persist: () => storageService.saveBillingCycleOverride(cycleOverride),
    });
  },
  deleteCycleOverride: async (overrideId) => {
    const previousCycleOverrides = get().cycleOverrides;
    const cycleOverrides = get().cycleOverrides.filter((override) => override.id !== overrideId);
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { cycleOverrides: previousCycleOverrides },
      nextState: { cycleOverrides },
      persist: () => storageService.deleteBillingCycleOverride(overrideId),
    });
  },
}));
