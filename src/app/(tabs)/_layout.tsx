import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';

export default function TabsLayout() {
  const theme = useAppTheme();
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  const systemHydrated = useSystemStore((state) => state.hasHydrated);
  const systemProfile = useSystemStore((state) => state.systemProfile);

  if (!settingsHydrated || !systemHydrated) {
    return <LoadingScreen />;
  }

  if (!onboardingCompleted || !systemProfile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSubtle,
        sceneStyle: { backgroundColor: theme.background },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" color={color} size={30} />,
        }}
      />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
