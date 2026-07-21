import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { useReadingsStore } from '@/stores/readings.store';
import { fontFamilies } from '@/theme/typography';
import { formatShortDate } from '@/utils/date';

const APP_VERSION = '1.0.0';

const drawerColors = {
  background: '#101011',
  avatarBackground: '#17171a',
  border: 'rgba(255, 255, 255, 0.12)',
  icon: '#b7b5bf',
  text: '#d8d6df',
  muted: '#a5a3ad',
  pressed: 'rgba(255, 255, 255, 0.06)',
  support: '#047857',
} as const;

type DrawerItemProps = {
  icon: AppIconName;
  label: string;
  onPress: () => void;
};

type ExpoDrawerNavigation = {
  closeDrawer: () => void;
};

type WattTrackDrawerContentProps = {
  navigation: ExpoDrawerNavigation;
};

function DrawerDivider() {
  return <View style={{ height: 1, backgroundColor: drawerColors.border, marginTop: 22, marginBottom: 28 }} />;
}

function DrawerItem({ icon, label, onPress }: DrawerItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        minHeight: 58,
        borderRadius: 16,
        borderCurve: 'continuous',
        paddingHorizontal: 10,
        opacity: pressed ? 0.72 : 1,
        backgroundColor: pressed ? drawerColors.pressed : 'transparent',
      })}
    >
      <View style={{ width: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={31} color={drawerColors.icon} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: drawerColors.text,
          fontSize: 18,
          fontFamily: fontFamilies.bodyStrong,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function WattTrackDrawerContent({ navigation }: WattTrackDrawerContentProps) {
  const insets = useSafeAreaInsets();
  const readings = useReadingsStore((state) => state.readings);
  const latestReading = readings[0];
  const lastSyncText = latestReading
    ? `${formatShortDate(latestReading.date)}${latestReading.time ? `, ${latestReading.time}` : ''}`
    : 'Local profile';

  const navigateTo = (href: string | { pathname: string; params?: Record<string, string> }) => {
    navigation.closeDrawer();
    requestAnimationFrame(() => {
      router.push(href as never);
    });
  };

  const showComingSoon = (title: string) => {
    navigation.closeDrawer();
    Alert.alert(title, 'This section will be connected soon.');
  };

  const showRatePrompt = () => {
    navigation.closeDrawer();
    Alert.alert('Rate WattTrack', 'Play Store rating can be connected once WattTrack is published.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: drawerColors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingTop: Math.max(insets.top + 18, 42),
          paddingBottom: Math.max(insets.bottom + 110, 140),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <View
            style={{
              height: 70,
              width: 70,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 28,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: drawerColors.border,
              backgroundColor: drawerColors.avatarBackground,
            }}
          >
            <Text style={{ color: drawerColors.text, fontSize: 24, fontFamily: fontFamilies.displayMedium }}>WT</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
            <Text numberOfLines={1} style={{ color: drawerColors.text, fontSize: 24, fontFamily: fontFamilies.displayMedium }}>
              WattTrack
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="cloud-outline" size={17} color={drawerColors.muted} />
              <Text numberOfLines={1} style={{ flex: 1, color: drawerColors.muted, fontSize: 14, fontFamily: fontFamilies.body }}>
                {lastSyncText}
              </Text>
            </View>
          </View>
        </View>

        <DrawerDivider />

        <View style={{ gap: 17 }}>
          <DrawerItem icon="person-outline" label="Profile" onPress={() => navigateTo({ pathname: '/onboarding', params: { mode: 'edit' } })} />
          <DrawerItem icon="settings-outline" label="Settings" onPress={() => navigateTo('/(tabs)/profile-settings')} />
          <DrawerItem icon="server-outline" label="Data" onPress={() => navigateTo('/(tabs)/data')} />
          <DrawerItem icon="star-outline" label="Rate us" onPress={showRatePrompt} />
          <DrawerItem icon="headset-outline" label="Support" onPress={() => showComingSoon('Support')} />
          <DrawerItem icon="information-circle-outline" label="About" onPress={() => showComingSoon(`WattTrack ${APP_VERSION}`)} />
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Support"
        onPress={() => showComingSoon('Support')}
        style={({ pressed }) => ({
          position: 'absolute',
          left: 28,
          bottom: Math.max(insets.bottom + 28, 48),
          height: 64,
          width: 64,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 32,
          backgroundColor: drawerColors.support,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Ionicons name="heart-outline" size={31} color="#ecfdf5" />
      </Pressable>
    </View>
  );
}
