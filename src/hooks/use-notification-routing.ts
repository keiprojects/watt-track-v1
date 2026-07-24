import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  getNotificationsUnavailableMessage,
  loadNotificationsModule,
} from '@/services/notifications.runtime';

const ADD_READING_ROUTE = '/(tabs)/add';

export function useNotificationRouting() {
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

      if (
        !handledInitialNotification &&
        initialResponse?.notification.request.content.data?.route === ADD_READING_ROUTE
      ) {
        handledInitialNotification = true;
        router.push(ADD_READING_ROUTE);
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const route = response.notification.request.content.data?.route;

        if (route === ADD_READING_ROUTE) {
          router.push(ADD_READING_ROUTE);
        }
      });
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);
}
