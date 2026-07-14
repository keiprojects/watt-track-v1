import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import {
  getNotificationsUnavailableMessage,
  loadNotificationsModule,
} from '@/services/notifications.runtime';
import { useAppTheme } from '@/theme/use-app-theme';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

export default function RootLayout() {
  const theme = useAppTheme();
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);

  useEffect(() => {
    void Promise.all([hydrateSettings(), hydrateSystem(), hydrateReadings(), hydrateCosts()]);
  }, [hydrateCosts, hydrateReadings, hydrateSettings, hydrateSystem]);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;
    let handledInitialNotification = false;

    void (async () => {
      const Notifications = await loadNotificationsModule();
      if (!Notifications || !isMounted) {
        if (__DEV__) {
          console.info(getNotificationsUnavailableMessage());
        }
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const initialResponse = await Notifications.getLastNotificationResponseAsync();

      if (!handledInitialNotification && initialResponse?.notification.request.content.data?.route === '/(tabs)/add') {
        handledInitialNotification = true;
        router.push('/(tabs)/add');
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const route = response.notification.request.content.data?.route;

        if (route === '/(tabs)/add') {
          router.push('/(tabs)/add');
        }
      });
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
