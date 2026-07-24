import { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

export function AppStatusBar() {
  const theme = useAppTheme();
  const statusBarStyle = theme.mode === 'dark' ? 'light-content' : 'dark-content';

  useEffect(() => {
    if (process.env.EXPO_OS !== 'android') {
      return;
    }

    StatusBar.setBackgroundColor(theme.background, true);
    StatusBar.setTranslucent(false);
  }, [theme.background]);

  return (
    <StatusBar
      barStyle={statusBarStyle}
      backgroundColor={theme.background}
      translucent={false}
      animated
    />
  );
}
