import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useState } from 'react';

import { WattTrackDrawer } from '@/components/watt-track-drawer';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export default function TabsLayout() {
  const theme = useAppTheme();
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const [profileDrawerVisible, setProfileDrawerVisible] = useState(false);

  if (!onboardingCompleted || !systemProfile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSubtle,
          sceneStyle: { backgroundColor: theme.background },
          tabBarStyle: {
            height: 70,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.surface,
            paddingTop: 7,
            paddingBottom: 7,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: fontFamilies.bodyStrong,
            marginBottom: 1,
          },
          tabBarItemStyle: {
            paddingVertical: 3,
          },
          tabBarIconStyle: { marginTop: 1 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Readings',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          listeners={{
            tabPress: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              setProfileDrawerVisible(true);
            },
          }}
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen name="data" options={{ href: null }} />
      </Tabs>
      <WattTrackDrawer visible={profileDrawerVisible} onClose={() => setProfileDrawerVisible(false)} />
    </>
  );
}
