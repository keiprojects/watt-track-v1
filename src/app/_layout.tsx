import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import {
  getNotificationsUnavailableMessage,
  loadNotificationsModule,
} from '@/services/notifications.runtime';

export default function RootLayout() {
  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

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
      <StatusBar style="auto" />
    </>
  );
}
