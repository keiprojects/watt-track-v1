import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/segmented-control';
import { ListChevron, ScreenHeader, ScreenScroll, SectionHeader, SoftCard } from '@/components/watt-ui';
import { APP_VERSION } from '@/constants/about';
import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';
import { useBillingCyclesStore } from '@/stores/billing-cycles.store';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { AppTheme } from '@/types/settings';
import { useAppFormatters } from '@/utils/format';

type SettingsIonIconName = ComponentProps<typeof Ionicons>['name'];
type SettingsMaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type SettingsIconFamily = 'ionicons' | 'material-community';

const themeOptions: { label: string; value: AppTheme; icon: SettingsIonIconName }[] = [
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
];

function formatCoordinates(latitude?: number, longitude?: number): string | undefined {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return undefined;
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function SettingRow({
  icon,
  iconFamily = 'ionicons',
  title,
  value,
  onPress,
  destructive = false,
}: {
  icon: SettingsIonIconName | SettingsMaterialCommunityIconName;
  iconFamily?: SettingsIconFamily;
  title: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          height: 32,
          width: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: destructive ? theme.dangerSoft : theme.accentSoft,
        }}
      >
        {iconFamily === 'material-community' ? (
          <MaterialCommunityIcons name={icon as SettingsMaterialCommunityIconName} size={18} color={destructive ? theme.dangerText : theme.accent} />
        ) : (
          <Ionicons name={icon as SettingsIonIconName} size={17} color={destructive ? theme.dangerText : theme.accent} />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: destructive ? theme.dangerText : theme.text,
          fontSize: 14,
          fontFamily: fontFamilies.bodyStrong,
        }}
      >
        {title}
      </Text>
      {value ? (
        <Text numberOfLines={1} style={{ maxWidth: 132, color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
          {value}
        </Text>
      ) : null}
      {onPress ? <ListChevron /> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateBillingCycles = useBillingCyclesStore((state) => state.hydrate);
  const themePreference = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const { formatCurrency, formatRate } = useAppFormatters();
  const profileLocationSummary =
    [systemProfile?.location, formatCoordinates(systemProfile?.latitude, systemProfile?.longitude)].filter(Boolean).join(' | ') ||
    'Set your system location';

  const rehydrateAllStores = async () => {
    await Promise.all([hydrateSystem(), hydrateSettings(), hydrateReadings(), hydrateCosts(), hydrateBillingCycles()]);
  };

  const resetApplication = () => {
    Alert.alert('Clear local data?', 'This removes your profile, readings, bill cycles, costs, settings, and reminder schedule from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear data',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await notificationService.disableDailyReminder();
            await storageService.clearAllData();
            await rehydrateAllStores();
            router.replace('/onboarding');
          })().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Unable to clear local data.';
            Alert.alert('Reset failed', message);
          });
        },
      },
    ]);
  };

  return (
    <ScreenScroll gap={18}>
      <ScreenHeader title="Settings" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit WattTrack profile"
        onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
        style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}
      >
        <SoftCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              height: 56,
              width: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: theme.accent,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 25, fontFamily: fontFamilies.displayMedium }}>
              {(systemProfile?.systemName?.trim()?.[0] ?? 'W').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontFamily: fontFamilies.bodyHeavy }}>
              {systemProfile?.systemName ?? 'Watt Track'}
            </Text>
            <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
              {profileLocationSummary}
            </Text>
          </View>
          <ListChevron />
        </SoftCard>
      </Pressable>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Preferences" />
        <SoftCard>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: theme.accentSoft,
                }}
              >
                <Ionicons name="contrast-outline" size={17} color={theme.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>Theme</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
                  Use your device setting or choose a fixed appearance.
                </Text>
              </View>
            </View>
            <SegmentedControl
              options={themeOptions}
              value={themePreference}
              onChange={(nextTheme) => {
                void updateSettings({ theme: nextTheme });
              }}
            />
          </View>
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="System" />
        <SoftCard>
          <SettingRow
            icon="home-outline"
            title="System Info"
            value={systemProfile?.installationDate ?? 'Not set'}
            onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
          />
          <SettingRow
            icon="transmission-tower"
            iconFamily="material-community"
            title="Tariff / Electricity Rate"
            value={formatRate(systemProfile?.defaultImportRate ?? 0)}
            onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
          />
          <SettingRow
            icon="wallet-outline"
            title="System Cost & ROI"
            value={formatCurrency(systemProfile?.initialSystemCost ?? 0)}
            onPress={() => router.push('/(tabs)/insights')}
          />
          <SettingRow icon="options-outline" title="Units" value="kWh, PHP" />
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Data" />
        <SoftCard>
          <SettingRow icon="cloud-upload-outline" title="Backup & Export" onPress={() => router.push('/(tabs)/data')} />
          <SettingRow icon="trash-outline" title="Clear Local Data" destructive onPress={resetApplication} />
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="About" />
        <SoftCard>
          <SettingRow icon="shield-checkmark-outline" title="Privacy & Support" value="Local data" onPress={() => router.push('/privacy' as never)} />
          <SettingRow
            icon="information-circle-outline"
            title="About Watt Track"
            value={`Version ${APP_VERSION}`}
            onPress={() => router.push('/about' as never)}
          />
        </SoftCard>
      </View>
    </ScreenScroll>
  );
}
