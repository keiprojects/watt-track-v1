import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import { formatShortDate } from '@/utils/date';

type DrawerItemProps = {
  icon: AppIconName;
  label: string;
  subtitle?: string;
  route?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
};

type WattTrackDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

function DrawerDivider() {
  const theme = useAppTheme();

  return <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />;
}

function DrawerItem({ icon, label, subtitle, route, onPress, tone = 'default' }: DrawerItemProps) {
  const theme = useAppTheme();
  const isDanger = tone === 'danger';
  const textColor = isDanger ? theme.dangerText : theme.text;
  const iconColor = isDanger ? theme.dangerText : theme.textMuted;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (route) {
      router.push(route as never);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderRadius: 18,
        borderCurve: 'continuous',
        paddingHorizontal: 8,
        paddingVertical: 10,
        backgroundColor: pressed ? theme.surfaceRaised : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ width: 42, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={25} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: textColor, fontSize: 16, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
        {subtitle ? <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>{subtitle}</Text> : null}
      </View>
      {route ? <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} /> : null}
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

  const navigateTo = (route: string) => {
    onClose();
    requestAnimationFrame(() => {
      router.push(route as never);
    });
  };

  const showRatePrompt = () => {
    onClose();
    Alert.alert('Rate WattTrack', 'Thanks for using WattTrack. Rating flow can be connected to the Play Store listing once the app is published.');
  };

  const showSignOutPrompt = () => {
    onClose();
    Alert.alert('Local profile only', 'WattTrack currently stores your profile and readings locally on this device. There is no cloud account to sign out from yet.');
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.scrim }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close drawer" onPress={onClose} style={{ position: 'absolute', inset: 0 }} />
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
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 18 }}
            alwaysBounceVertical={false}
          >
            <View style={{ gap: 18, paddingTop: 10 }}>
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
                      WattTrack
                    </Text>
                    <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>
                      {lastSyncText}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close drawer"
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
                  gap: 12,
                  borderRadius: 24,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  padding: 16,
                }}
              >
                <View style={{ gap: 3 }}>
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
            </View>

            <DrawerDivider />
            <DrawerItem icon="home-outline" label="Dashboard" route="/(tabs)" onPress={() => navigateTo('/(tabs)')} />
            <DrawerItem icon="sunny-outline" label="Solar System" route="/(tabs)/solar-system" onPress={() => navigateTo('/(tabs)/solar-system')} />
            <DrawerItem icon="document-text-outline" label="Reports" route="/(tabs)/reports" onPress={() => navigateTo('/(tabs)/reports')} />
            <DrawerItem icon="cloud-upload-outline" label="Backup & Sync" route="/(tabs)/backup-sync" onPress={() => navigateTo('/(tabs)/backup-sync')} />

            <DrawerDivider />
            <DrawerItem icon="person-outline" label="Profile" route="/(tabs)/profile" onPress={() => navigateTo('/(tabs)/profile')} />
            <DrawerItem icon="settings-outline" label="Settings" route="/(tabs)/settings" onPress={() => navigateTo('/(tabs)/settings')} />
            <DrawerItem icon="heart-outline" label="Support" route="/(tabs)/support" onPress={() => navigateTo('/(tabs)/support')} />
            <DrawerItem icon="star-outline" label="Rate WattTrack" onPress={showRatePrompt} />
            <DrawerItem icon="information-circle-outline" label="About" route="/(tabs)/about" onPress={() => navigateTo('/(tabs)/about')} />

            <DrawerDivider />
            <DrawerItem icon="log-out-outline" label="Sign Out" onPress={showSignOutPrompt} tone="danger" />
            <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body, paddingHorizontal: 50, paddingTop: 6 }}>
              Version 1.0.0
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
