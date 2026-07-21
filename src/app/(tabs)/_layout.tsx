import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

function TabIcon({
  focused,
  color,
  name,
  activeName,
  size = 22,
}: {
  focused: boolean;
  color: string;
  name: ComponentProps<typeof Ionicons>['name'];
  activeName: ComponentProps<typeof Ionicons>['name'];
  size?: number;
}) {
  return <Ionicons name={focused ? activeName : name} color={color} size={size} />;
}

export default function TabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const onboardingCompleted = useSettingsStore((state) => state.settings.onboardingCompleted);
  const systemProfile = useSystemStore((state) => state.systemProfile);

  if (!onboardingCompleted || !systemProfile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSubtle,
        sceneStyle: { backgroundColor: theme.background },
        tabBarStyle: {
          position: 'absolute',
          right: 16,
          bottom: 12 + insets.bottom,
          left: 16,
          height: 72,
          borderTopWidth: 0,
          borderRadius: 26,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceOverlay,
          paddingTop: 8,
          paddingBottom: 8,
          boxShadow: theme.shadow,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fontFamilies.bodyStrong,
          marginTop: 2,
        },
        tabBarItemStyle: {
          minHeight: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={String(color)} name="home-outline" activeName="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={String(color)} name="bar-chart-outline" activeName="bar-chart" />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add reading"
              onPress={props.onPress}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.82 : 1,
                transform: [{ translateY: -10 }, { scale: pressed ? 0.96 : 1 }],
              })}
            >
              <View
                style={{
                  height: 56,
                  width: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  backgroundColor: theme.accent,
                  boxShadow: `0 12px 24px ${theme.accentGlow}`,
                }}
              >
                <Ionicons name="add" size={31} color="#ffffff" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={String(color)} name="time-outline" activeName="time" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={String(color)} name="ellipsis-horizontal" activeName="settings" size={24} />
          ),
        }}
      />
      <Tabs.Screen name="data" options={{ href: null }} />
    </Tabs>
  );
}
