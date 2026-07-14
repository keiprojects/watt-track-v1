import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette } from '@/theme/colors';
import { useSettingsStore } from '@/stores/settings.store';

export function useAppTheme() {
  const themeSetting = useSettingsStore((state) => state.settings.theme);
  const deviceScheme = useColorScheme();

  return useMemo(() => {
    if (themeSetting === 'dark') {
      return darkPalette;
    }

    if (themeSetting === 'light') {
      return lightPalette;
    }

    return deviceScheme === 'dark' ? darkPalette : lightPalette;
  }, [deviceScheme, themeSetting]);
}
