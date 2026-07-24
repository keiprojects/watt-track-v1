import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/segmented-control';
import { ListChevron, ScreenHeader, ScreenScroll, SectionHeader, SettingsListRow, SoftCard } from '@/components/watt-ui';
import { APP_VERSION } from '@/constants/about';
import { useRehydrateAppStores } from '@/hooks/use-rehydrate-app-stores';
import { resetLocalAppData } from '@/services/local-data.service';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { AppTheme } from '@/types/settings';
import { getErrorMessage } from '@/utils/alerts';
import { formatCoordinates, useAppFormatters } from '@/utils/format';

type SettingsIonIconName = ComponentProps<typeof Ionicons>['name'];

const themeOptions: { label: string; value: AppTheme; icon: SettingsIonIconName }[] = [
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const theme = useAppTheme();
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const rehydrateAllStores = useRehydrateAppStores();
  const themePreference = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const { formatCurrency, formatRate } = useAppFormatters();
  const profileLocationSummary =
    [systemProfile?.location, formatCoordinates(systemProfile?.latitude, systemProfile?.longitude)].filter(Boolean).join(' | ') ||
    'Set your system location';

  const resetApplication = () => {
    Alert.alert('Clear local data?', 'This removes your profile, readings, bill cycles, costs, settings, and reminder schedule from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear data',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await resetLocalAppData();
            await rehydrateAllStores();
            router.replace('/onboarding');
          })().catch((error: unknown) => {
            Alert.alert('Reset failed', getErrorMessage(error, 'Unable to clear local data.'));
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
          <SettingsListRow
            icon="home-outline"
            title="System Info"
            value={systemProfile?.installationDate ?? 'Not set'}
            onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
          />
          <SettingsListRow
            icon="transmission-tower"
            iconFamily="material-community"
            title="Tariff / Electricity Rate"
            value={formatRate(systemProfile?.defaultImportRate ?? 0)}
            onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } })}
          />
          <SettingsListRow
            icon="wallet-outline"
            title="System Cost & ROI"
            value={formatCurrency(systemProfile?.initialSystemCost ?? 0)}
            onPress={() => router.push('/(tabs)/insights')}
          />
          <SettingsListRow icon="options-outline" title="Units" value="kWh, PHP" />
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Data" />
        <SoftCard>
          <SettingsListRow icon="cloud-upload-outline" title="Backup & Export" onPress={() => router.push('/(tabs)/data')} />
          <SettingsListRow icon="trash-outline" title="Clear Local Data" destructive onPress={resetApplication} />
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="About" />
        <SoftCard>
          <SettingsListRow icon="shield-checkmark-outline" title="Privacy & Support" value="Local data" onPress={() => router.push('/privacy' as never)} />
          <SettingsListRow
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
