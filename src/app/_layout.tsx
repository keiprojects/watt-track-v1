import '../../global.css';

import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BootSplash } from '@/components/boot-splash';
import { WattTrackDrawerContent } from '@/components/watt-track-drawer';
import {
  getNotificationsUnavailableMessage,
  loadNotificationsModule,
} from '@/services/notifications.runtime';
import { useAppTheme } from '@/theme/use-app-theme';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

const ANIMATED_SPLASH_MIN_DURATION_MS = 1600;

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore duplicate calls when Fast Refresh remounts the layout.
});

export default function RootLayout() {
  const theme = useAppTheme();
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const [hasBooted, setHasBooted] = useState(false);
  const [hasShownAnimatedSplash, setHasShownAnimatedSplash] = useState(false);
  const nativeSplashHiddenRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void Promise.allSettled([hydrateSettings(), hydrateSystem(), hydrateReadings(), hydrateCosts()]).then((results) => {
      if (__DEV__) {
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Hydration error:', result.reason);
          }
        });
      }

      if (isMounted) {
        setHasBooted(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hydrateCosts, hydrateReadings, hydrateSettings, hydrateSystem]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasShownAnimatedSplash(true);
    }, ANIMATED_SPLASH_MIN_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleAnimatedSplashReady = useCallback(() => {
    if (nativeSplashHiddenRef.current) {
      return;
    }

    nativeSplashHiddenRef.current = true;
    void SplashScreen.hideAsync().catch(() => {
      // The React splash is already visible, so a duplicate hide is harmless.
    });
  }, []);

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

  if (!hasBooted || !hasShownAnimatedSplash) {
    return (
      <>
        <BootSplash onReady={handleAnimatedSplashReady} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <Drawer
        drawerContent={(props) => <WattTrackDrawerContent navigation={props.navigation} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          swipeEnabled: true,
          overlayColor: 'rgba(0, 0, 0, 0.64)',
          drawerStyle: {
            width: '84%',
            maxWidth: 356,
            backgroundColor: '#101011',
          },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ title: 'WattTrack' }} />
        <Drawer.Screen
          name="onboarding"
          options={{
            title: 'Onboarding',
            drawerItemStyle: { display: 'none' },
            swipeEnabled: false,
          }}
        />
      </Drawer>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
