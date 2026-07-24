import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { AppStatusBar } from '@/components/app-status-bar';
import { BootSplash } from '@/components/boot-splash';
import { useNotificationRouting } from '@/hooks/use-notification-routing';
import { useRootLayoutBoot } from '@/hooks/use-root-layout-boot';
import { useAppTheme } from '@/theme/use-app-theme';

export default function RootLayout() {
  const theme = useAppTheme();
  const { isReady, handleAnimatedSplashReady } = useRootLayoutBoot();

  useNotificationRouting();

  if (!isReady) {
    return (
      <SafeAreaProvider style={{ flex: 1, backgroundColor: theme.background }}>
        <BootSplash onReady={handleAnimatedSplashReady} />
        <AppStatusBar />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <SafeAreaView
        edges={['top']}
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.background,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="readings/[readingId]" />
          <Stack.Screen name="readings/edit/[readingId]" />
        </Stack>
      </SafeAreaView>

      <AppStatusBar />
    </SafeAreaProvider>
  );
}
