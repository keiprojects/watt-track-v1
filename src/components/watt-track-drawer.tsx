import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import { formatShortDate } from '@/utils/date';

const APP_VERSION = '1.0.0';

type DrawerItemProps = {
  icon: AppIconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

type WattTrackDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

function DrawerDivider() {
  const theme = useAppTheme();

  return <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 12 }} />;
}

function DrawerItem({ icon, label, subtitle, onPress }: DrawerItemProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 18,
        borderCurve: 'continuous',
        paddingHorizontal: 8,
        paddingVertical: 11,
        backgroundColor: pressed ? theme.surfaceRaised : 'transparent',
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <View
        style={{
          height: 42,
          width: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: theme.surfaceRaised,
        }}
      >
        <Ionicons name={icon} size={22} color={theme.textMuted} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
        {subtitle ? <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
    </Pressable>
  );
}

function formatCapacity(value?: number, suffix = 'kW') {
  if (!value || value <= 0) {
    return 'Not set';
  }

  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${suffix}`;
}

export function WattTrackDrawer({ visible, onClose }: WattTrackDrawerProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const readings = useReadingsStore((state) => state.readings);
  const latestReading = readings[0];
  const drawerWidth = Math.min(340, width * 0.86);
  const systemName = systemProfile?.systemName ?? 'Home Solar';
  const lastSyncText = latestReading
    ? `Last reading • ${formatShortDate(latestReading.date)}${latestReading.time ? `, ${latestReading.time}` : ''}`
    : 'No readings yet';

  const openSettings = () => {
    onClose();
    requestAnimationFrame(() => {
      router.push('/(tabs)/settings' as never);
    });
  };

  const editProfile = () => {
    onClose();
    requestAnimationFrame(() => {
      router.push({ pathname: '/onboarding', params: { mode: 'edit' } });
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.scrim }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close profile settings"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <Animated.View
          entering={SlideInLeft.duration(240)}
          style={{
            width: drawerWidth,
            flex: 1,
            backgroundColor: theme.background,
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 18),
            borderTopRightRadius: 32,
            borderBottomRightRadius: 32,
            borderCurve: 'continuous',
            overflow: 'hidden',
            boxShadow: theme.shadow,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18 }}
            alwaysBounceVertical={false}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View
                  style={{
                    height: 62,
                    width: 62,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 22,
                    borderCurve: 'continuous',
                    backgroundColor: theme.surfaceRaised,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.displayMedium }}>WT</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Text numberOfLines={1} style={{ color: theme.text, fontSize: 22, fontFamily: fontFamilies.displayMedium }}>
                    Profile
                  </Text>
                  <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>
                    {lastSyncText}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close profile settings"
                onPress={onClose}
                style={({ pressed }) => ({
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  backgroundColor: pressed ? theme.surfaceRaised : 'transparent',
                })}
              >
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <View
              style={{
                gap: 14,
                borderRadius: 24,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                padding: 16,
                marginTop: 22,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text style={{ color: theme.textSubtle, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.1, fontFamily: fontFamilies.bodyStrong }}>
                  Active system
                </Text>
                <Text numberOfLines={1} style={{ color: theme.text, fontSize: 18, fontFamily: fontFamilies.displayMedium }}>
                  {systemName}
                </Text>
                {systemProfile?.location ? (
                  <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
                    {systemProfile.location}
                  </Text>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Ionicons name="sunny-outline" size={17} color={theme.textMuted} />
                  <Text style={{ color: theme.textSubtle, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Solar</Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
                    {formatCapacity(systemProfile?.solarCapacityKw, 'kWp')}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Ionicons name="battery-half-outline" size={17} color={theme.textMuted} />
                  <Text style={{ color: theme.textSubtle, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Battery</Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.text, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
                    {formatCapacity(systemProfile?.batteryCapacityKwh, 'kWh')}
                  </Text>
                </View>
              </View>
            </View>

            <DrawerDivider />

            <DrawerItem icon="person-outline" label="Edit system profile" subtitle="System name, location, solar, battery, and cost" onPress={editProfile} />
            <DrawerItem icon="settings-outline" label="Profile settings" subtitle="Theme, reminders, export, backup, and reset" onPress={openSettings} />

            <DrawerDivider />

            <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body, paddingHorizontal: 8 }}>
              WattTrack is currently using a local profile on this device. Cloud account options can be added later.
            </Text>
            <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body, paddingHorizontal: 8, paddingTop: 14 }}>
              Version {APP_VERSION}
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
