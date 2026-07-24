import {
  Manrope_500Medium,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useBillingCyclesStore } from '@/stores/billing-cycles.store';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

const ANIMATED_SPLASH_MIN_DURATION_MS = 1600;

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore duplicate calls when Fast Refresh remounts the layout.
});

export function useRootLayoutBoot() {
  const hydrateBillingCycles = useBillingCyclesStore((state) => state.hydrate);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);

  const [hasHydratedStores, setHasHydratedStores] = useState(false);
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

    void Promise.allSettled([
      hydrateSettings(),
      hydrateSystem(),
      hydrateReadings(),
      hydrateCosts(),
      hydrateBillingCycles(),
    ]).then((results) => {
      if (__DEV__) {
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Hydration error:', result.reason);
          }
        });
      }

      if (isMounted) {
        setHasHydratedStores(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    hydrateBillingCycles,
    hydrateCosts,
    hydrateReadings,
    hydrateSettings,
    hydrateSystem,
  ]);

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

  return {
    isReady: hasHydratedStores && fontsLoaded && hasShownAnimatedSplash,
    handleAnimatedSplashReady,
  };
}
