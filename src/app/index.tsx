import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { LoadingScreen } from '@/components/loading-screen';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

export default function IndexScreen() {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const settings = useSettingsStore((state) => state.settings);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);

  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const systemHydrated = useSystemStore((state) => state.hasHydrated);

  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const readingsHydrated = useReadingsStore((state) => state.hasHydrated);

  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const costsHydrated = useCostsStore((state) => state.hasHydrated);

  useEffect(() => {
    void Promise.all([hydrateSettings(), hydrateSystem(), hydrateReadings(), hydrateCosts()]);
  }, [hydrateCosts, hydrateReadings, hydrateSettings, hydrateSystem]);

  if (!settingsHydrated || !systemHydrated || !readingsHydrated || !costsHydrated) {
    return <LoadingScreen label="Loading your local WattTrack data..." />;
  }

  if (!settings.onboardingCompleted || !systemProfile) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
