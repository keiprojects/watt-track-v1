import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import { persistOptimisticState } from '@/stores/persistence';
import type { SystemCost } from '@/types/cost';
import { sortCostsDescending } from '@/utils/domainSort';

type CostsState = {
  costs: SystemCost[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  saveCost: (cost: SystemCost) => Promise<void>;
  updateCost: (cost: SystemCost) => Promise<void>;
  deleteCost: (costId: string) => Promise<void>;
};

export const useCostsStore = create<CostsState>((set, get) => ({
  costs: [],
  hasHydrated: false,
  hydrate: async () => {
    try {
      const costs = await storageService.getSystemCosts();
      set({ costs: sortCostsDescending(costs), hasHydrated: true });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to hydrate costs store.', error);
      }

      set({ costs: [], hasHydrated: true });
    }
  },
  saveCost: async (cost) => {
    const previousCosts = get().costs;
    const costs = sortCostsDescending([cost, ...get().costs]);
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { costs: previousCosts },
      nextState: { costs },
      persist: () => storageService.saveSystemCost(cost),
    });
  },
  updateCost: async (cost) => {
    const previousCosts = get().costs;
    const costs = sortCostsDescending(get().costs.map((currentCost) => (currentCost.id === cost.id ? cost : currentCost)));
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { costs: previousCosts },
      nextState: { costs },
      persist: () => storageService.updateSystemCost(cost),
    });
  },
  deleteCost: async (costId) => {
    const previousCosts = get().costs;
    const costs = get().costs.filter((cost) => cost.id !== costId);
    await persistOptimisticState({
      set: (state) => set(state),
      previousState: { costs: previousCosts },
      nextState: { costs },
      persist: () => storageService.deleteSystemCost(costId),
    });
  },
}));
