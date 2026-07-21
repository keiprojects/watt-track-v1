import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Redirect, Tabs } from 'expo-router';

import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export default function TabsLayout() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  const systemProfile = useSystemStore((state) => state.systemProfile);

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
          position: 'relative',
          height: 68,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          borderRadius: 0,
          backgroundColor: theme.surface,
          paddingTop: 6,
          paddingBottom: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fontFamilies.bodyStrong,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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
          title: 'Readings',
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
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={{
          tabPress: (event: { preventDefault: () => void }) => {
            event.preventDefault();
            navigation.dispatch(DrawerActions.openDrawer());
          },
        }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={focused ? theme.accent : theme.textSubtle} size={28} />
          ),
        }}
      />
      <Tabs.Screen name="profile-settings" options={{ href: null }} />
      <Tabs.Screen name="data" options={{ href: null }} />
    </Tabs>
  );
}
