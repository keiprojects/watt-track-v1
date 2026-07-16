import { Redirect } from 'expo-router';

import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

export default function IndexScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const systemProfile = useSystemStore((state) => state.systemProfile);

  if (!settings.onboardingCompleted || !systemProfile) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
