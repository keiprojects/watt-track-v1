import { create } from 'zustand';

import { storageService } from '@/services/storage.service';
import type { SystemCost } from '@/types/cost';

type CostsState = {
  costs: SystemCost[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  saveCost: (cost: SystemCost) => Promise<void>;
};

export const useCostsStore = create<CostsState>((set, get) => ({
  costs: [],
  hasHydrated: false,
  hydrate: async () => {
    const costs = await storageService.getSystemCosts();
    set({ costs, hasHydrated: true });
  },
  saveCost: async (cost) => {
    const costs = [cost, ...get().costs];
    set({ costs });
    await storageService.saveSystemCost(cost);
  },
}));
