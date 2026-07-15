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
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSubtle,
        sceneStyle: { backgroundColor: theme.background },
        tabBarStyle: {
          height: 72,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          backgroundColor: theme.header,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
        tabBarIconStyle: { marginTop: 2 },
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
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={focused ? theme.accent : theme.textSubtle} size={28} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
