import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

export default function TabsLayout() {
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
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTitleStyle: { color: '#0f172a', fontWeight: '700' },
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { backgroundColor: '#ffffff' },
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
