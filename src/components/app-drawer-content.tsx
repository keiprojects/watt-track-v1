import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from 'expo-router/drawer';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import { formatShortDate } from '@/utils/date';

const APP_VERSION = '1.0.0';

type DrawerRoute = '/(tabs)' | '/(tabs)/insights' | '/(tabs)/history' | '/(tabs)/settings' | '/(tabs)/data' | '/onboarding';

function DrawerIcon({ name, color }: { name: ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons name={name} size={20} color={color} />;
}

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const theme = useAppTheme();
  const profile = useSystemStore((state) => state.systemProfile);
  const latestReading = useReadingsStore((state) => state.readings[0]);
  const lastReading = latestReading
    ? `${formatShortDate(latestReading.date)}${latestReading.time ? `, ${latestReading.time}` : ''}`
    : 'No readings yet';

  const navigateTo = (route: DrawerRoute, params?: Record<string, string>) => {
    props.navigation.closeDrawer();
    requestAnimationFrame(() => {
      if (route === '/onboarding') {
        router.push({ pathname: route, params });
        return;
      }

      router.push(route);
    });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: 20,
        backgroundColor: theme.surface,
      }}
    >
      <View style={{ gap: 8, paddingHorizontal: 20, paddingBottom: 24 }}>
        <View
          style={{
            height: 58,
            width: 58,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            backgroundColor: theme.accent,
          }}
        >
          <Ionicons name="flash" size={30} color="#ffffff" />
        </View>
        <Text style={{ color: theme.text, fontSize: 24, fontFamily: fontFamilies.displayMedium }}>Watt Track</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
          {profile?.systemName ?? 'Local solar tracker'}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>Last reading: {lastReading}</Text>
      </View>

      <DrawerItem
        label="Home"
        icon={({ color }) => <DrawerIcon name="home-outline" color={String(color)} />}
        labelStyle={{ fontFamily: fontFamilies.bodyStrong }}
        activeTintColor={theme.accent}
        inactiveTintColor={theme.textMuted}
        onPress={() => navigateTo('/(tabs)')}
      />
      <DrawerItem
        label="Analytics"
        icon={({ color }) => <DrawerIcon name="bar-chart-outline" color={String(color)} />}
        labelStyle={{ fontFamily: fontFamilies.bodyStrong }}
        activeTintColor={theme.accent}
        inactiveTintColor={theme.textMuted}
        onPress={() => navigateTo('/(tabs)/insights')}
      />
      <DrawerItem
        label="History"
        icon={({ color }) => <DrawerIcon name="time-outline" color={String(color)} />}
        labelStyle={{ fontFamily: fontFamilies.bodyStrong }}
        activeTintColor={theme.accent}
        inactiveTintColor={theme.textMuted}
        onPress={() => navigateTo('/(tabs)/history')}
      />
      <DrawerItem
        label="Settings"
        icon={({ color }) => <DrawerIcon name="settings-outline" color={String(color)} />}
        labelStyle={{ fontFamily: fontFamilies.bodyStrong }}
        activeTintColor={theme.accent}
        inactiveTintColor={theme.textMuted}
        onPress={() => navigateTo('/(tabs)/settings')}
      />
      <DrawerItem
        label="Backup & export"
        icon={({ color }) => <DrawerIcon name="cloud-upload-outline" color={String(color)} />}
        labelStyle={{ fontFamily: fontFamilies.bodyStrong }}
        activeTintColor={theme.accent}
        inactiveTintColor={theme.textMuted}
        onPress={() => navigateTo('/(tabs)/data')}
      />
      <DrawerItem
        label="Edit system profile"
        icon={({ color }) => <DrawerIcon name="create-outline" color={String(color)} />}
        labelStyle={{ fontFamily: fontFamilies.bodyStrong }}
        activeTintColor={theme.accent}
        inactiveTintColor={theme.textMuted}
        onPress={() => navigateTo('/onboarding', { mode: 'edit' })}
      />

      <View style={{ flex: 1 }} />
      <View style={{ padding: 20, gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>Version {APP_VERSION}</Text>
        <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>
          Local-first solar, grid, savings, and ROI tracking.
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}
