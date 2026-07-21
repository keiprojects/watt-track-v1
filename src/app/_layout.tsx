import 'react-native-gesture-handler';

import { router, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Manrope_500Medium,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { BootSplash } from '@/components/boot-splash';
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
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

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

  if (!hasBooted || !fontsLoaded || !hasShownAnimatedSplash) {
    return (
      <>
        <BootSplash onReady={handleAnimatedSplashReady} />
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="readings/[readingId]" />
        <Stack.Screen name="readings/edit/[readingId]" />
      </Stack>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
