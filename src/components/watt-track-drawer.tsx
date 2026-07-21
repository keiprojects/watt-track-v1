import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { useReadingsStore } from '@/stores/readings.store';
import { fontFamilies } from '@/theme/typography';
import { formatShortDate } from '@/utils/date';

const APP_VERSION = '1.0.0';

const drawerColors = {
  background: '#101011',
  avatarBackground: '#151517',
  border: 'rgba(255, 255, 255, 0.13)',
  icon: '#c3c1ca',
  text: '#e5e3e9',
  muted: '#a9a6b0',
  pressed: 'rgba(255, 255, 255, 0.06)',
  scrim: 'rgba(0, 0, 0, 0.66)',
} as const;

type DrawerItemProps = {
  icon: AppIconName;
  label: string;
  onPress: () => void;
};

type WattTrackDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

function DrawerItem({ icon, label, onPress }: DrawerItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        borderRadius: 14,
        paddingHorizontal: 8,
        backgroundColor: pressed ? drawerColors.pressed : 'transparent',
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <View style={{ width: 42, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={29} color={drawerColors.icon} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: drawerColors.text,
          fontSize: 19,
          fontFamily: fontFamilies.body,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function WattTrackDrawer({ visible, onClose }: WattTrackDrawerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const readings = useReadingsStore((state) => state.readings);
  const latestReading = readings[0];
  const drawerWidth = Math.min(356, width * 0.84);
  const lastSyncText = latestReading
    ? `${formatShortDate(latestReading.date)}${latestReading.time ? `, ${latestReading.time}` : ''}`
    : 'Local data only';

  const navigateTo = (route: string) => {
    onClose();
    requestAnimationFrame(() => router.push(route as never));
  };

  const openProfile = () => {
    onClose();
    requestAnimationFrame(() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } }));
  };

  const showRatePrompt = () => {
    onClose();
    Alert.alert('Rate WattTrack', 'The store rating link will be enabled when WattTrack is published.');
  };

  const showInfo = (title: string, message: string) => {
    onClose();
    Alert.alert(title, message);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: drawerColors.scrim }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close profile menu"
          onPress={onClose}
          style={{ position: 'absolute', inset: 0 }}
        />

        <Animated.View
          entering={SlideInLeft.duration(220)}
          style={{
            width: drawerWidth,
            flex: 1,
            overflow: 'hidden',
            backgroundColor: drawerColors.background,
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 18),
            borderBottomRightRadius: 28,
            boxShadow: '16px 0 44px rgba(0, 0, 0, 0.46)',
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical={false}
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop: 22,
              paddingBottom: Math.max(insets.bottom + 28, 48),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <View
                style={{
                  height: 72,
                  width: 72,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 26,
                  borderWidth: 1,
                  borderColor: drawerColors.border,
                  backgroundColor: drawerColors.avatarBackground,
                }}
              >
                <Text style={{ color: drawerColors.text, fontSize: 24, fontFamily: fontFamilies.displayMedium }}>WT</Text>
              </View>

              <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                <Text numberOfLines={1} style={{ color: drawerColors.text, fontSize: 26, fontFamily: fontFamilies.displayMedium }}>
                  WattTrack
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Ionicons name="cloud-outline" size={18} color={drawerColors.muted} />
                  <Text numberOfLines={1} style={{ flex: 1, color: drawerColors.muted, fontSize: 14, fontFamily: fontFamilies.body }}>
                    {lastSyncText}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: drawerColors.border, marginTop: 28, marginBottom: 22 }} />

            <View style={{ gap: 7 }}>
              <DrawerItem icon="person-outline" label="Profile" onPress={openProfile} />
              <DrawerItem icon="settings-outline" label="Settings" onPress={() => navigateTo('/(tabs)/settings')} />
              <DrawerItem icon="server-outline" label="Data" onPress={() => navigateTo('/(tabs)/data')} />
              <DrawerItem icon="star-outline" label="Rate us" onPress={showRatePrompt} />
              <DrawerItem
                icon="headset-outline"
                label="Support"
                onPress={() => showInfo('Support', 'Support contact options will be added before public release.')}
              />
              <DrawerItem
                icon="information-circle-outline"
                label="About"
                onPress={() => showInfo('About WattTrack', `WattTrack ${APP_VERSION}\nLocal solar savings and ROI tracking.`)}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
