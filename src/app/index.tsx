import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

export default function IndexScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);

  const systemProfile = useSystemStore((state) => state.systemProfile);
  const systemHydrated = useSystemStore((state) => state.hasHydrated);

  const readingsHydrated = useReadingsStore((state) => state.hasHydrated);
  const costsHydrated = useCostsStore((state) => state.hasHydrated);

  if (!settingsHydrated || !systemHydrated || !readingsHydrated || !costsHydrated) {
    return <LoadingScreen label="Loading your local WattTrack data..." />;
  }

  if (!settings.onboardingCompleted || !systemProfile) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
