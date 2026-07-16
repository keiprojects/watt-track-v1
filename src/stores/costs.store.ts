import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { SystemCost } from '@/types/cost';

function sortCostsDescending(costs: SystemCost[]): SystemCost[] {
  return [...costs].sort((left, right) => right.date.localeCompare(left.date));
}

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
    const costs = sortCostsDescending([cost, ...get().costs]);
    set({ costs });
    await storageService.saveSystemCost(cost);
  },
  updateCost: async (cost) => {
    const costs = sortCostsDescending(get().costs.map((currentCost) => (currentCost.id === cost.id ? cost : currentCost)));
    set({ costs });
    await storageService.updateSystemCost(cost);
  },
  deleteCost: async (costId) => {
    const costs = get().costs.filter((cost) => cost.id !== costId);
    set({ costs });
    await storageService.deleteSystemCost(costId);
  },
}));
