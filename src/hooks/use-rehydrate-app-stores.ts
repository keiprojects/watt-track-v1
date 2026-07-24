import { useCallback } from 'react';

import { useBillingCyclesStore } from '@/stores/billing-cycles.store';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

export function useRehydrateAppStores() {
  const hydrateBillingCycles = useBillingCyclesStore((state) => state.hydrate);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);

  return useCallback(
    async () => {
      await Promise.all([
        hydrateSystem(),
        hydrateSettings(),
        hydrateReadings(),
        hydrateCosts(),
        hydrateBillingCycles(),
      ]);
    },
    [
      hydrateBillingCycles,
      hydrateCosts,
      hydrateReadings,
      hydrateSettings,
      hydrateSystem,
    ],
  );
}
