import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { AppButton, IconBadge, MotionSection, Panel, SectionTitle, useScreenContentContainerStyle } from '@/components/app-ui';
import { SegmentedControl } from '@/components/segmented-control';
import { exportService } from '@/services/export.service';
import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { AppTheme, DashboardPeriod } from '@/types/settings';
import type { ExportInputMode, ReadingInputMode } from '@/types/system';
import { useAppFormatters } from '@/utils/format';

const themeOptions: { label: string; value: AppTheme; icon: 'moon-outline' | 'sunny-outline' | 'phone-portrait-outline' }[] = [
  { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Light', value: 'light', icon: 'sunny-outline' },
  { label: 'Dark', value: 'dark', icon: 'moon-outline' },
];

const dashboardPeriodOptions: { label: string; value: DashboardPeriod; icon: 'calendar-outline' | 'pulse-outline' }[] = [
  { label: '7d', value: '7d', icon: 'pulse-outline' },
  { label: '30d', value: '30d', icon: 'pulse-outline' },
  { label: 'Month', value: 'month', icon: 'calendar-outline' },
  { label: 'Year', value: 'year', icon: 'calendar-outline' },
  { label: 'All', value: 'all', icon: 'calendar-outline' },
];

const decimalOptions = ['0', '1', '2', '3'] as const;

function formatReadingMode(mode?: ReadingInputMode): string {
  return mode === 'daily' ? 'Daily usage' : 'Meter reading';
}

function formatExportMode(mode?: ExportInputMode): string {
  if (mode === 'daily') {
    return 'Daily export';
  }

  if (mode === 'cumulative') {
    return 'Meter reading';
  }

  return 'Off';
}

function MenuRow({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: 'person-outline' | 'settings-outline' | 'notifications-outline' | 'download-outline' | 'shield-checkmark-outline' | 'create-outline';
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        borderRadius: 20,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surfaceRaised,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <IconBadge icon={icon} tone="accent" />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{title}</Text>
          {subtitle ? <Text style={{ color: theme.textSubtle, fontSize: 13 }}>{subtitle}</Text> : null}
        </View>
      </View>
      {action}
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const readings = useReadingsStore((state) => state.readings);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const setReadings = useReadingsStore((state) => state.setReadings);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const { formatCurrency, formatRate } = useAppFormatters();
  const contentContainerStyle = useScreenContentContainerStyle();

  const [themePreference, setThemePreference] = useState<AppTheme>(settings.theme);
  const [decimalPlaces, setDecimalPlaces] = useState(String(settings.decimalPlaces));
  const [defaultDashboardPeriod, setDefaultDashboardPeriod] = useState<DashboardPeriod>(settings.defaultDashboardPeriod);
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime ?? '19:00');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setThemePreference(settings.theme);
    setDecimalPlaces(String(settings.decimalPlaces));
    setDefaultDashboardPeriod(settings.defaultDashboardPeriod);
    setReminderEnabled(settings.reminderEnabled);
    setReminderTime(settings.reminderTime ?? '19:00');
  }, [settings]);

  const rehydrateAllStores = async () => {
    await Promise.all([hydrateSystem(), hydrateSettings(), hydrateReadings(), hydrateCosts()]);
  };

  const saveDisplaySettings = async () => {
    await updateSettings({
      theme: themePreference,
      decimalPlaces: Number(decimalPlaces),
      defaultDashboardPeriod,
    });
    setStatusMessage('Display settings saved on this device.');
  };

  const saveReminderSettings = async () => {
    if (!reminderEnabled) {
      await notificationService.disableDailyReminder();
      await updateSettings({
        reminderEnabled: false,
        reminderTime: undefined,
      });
      setStatusMessage('Daily reminder disabled.');
      return;
    }

    try {
      await notificationService.enableDailyReminder(reminderTime);
      await updateSettings({
        reminderEnabled: true,
        reminderTime,
      });
      setStatusMessage(`Daily reminder saved for ${reminderTime}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save reminder settings.';
      Alert.alert('Reminder not saved', message);
    }
  };

  const exportCsv = async () => {
    try {
      const result = await exportService.exportReadingsCsv(readings);
      setStatusMessage(`Readings exported as ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export CSV.';
      Alert.alert('Export failed', message);
    }
  };

  const exportBackup = async () => {
    try {
      const result = await exportService.exportBackupFile();
      setStatusMessage(`Backup exported as ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export backup.';
      Alert.alert('Backup failed', message);
    }
  };

  const importBackup = async () => {
    try {
      const payload = await exportService.pickBackupContents();
      if (!payload) {
        return;
      }

      const parsedBackup = JSON.parse(payload);
      Alert.alert('Replace current data?', 'Importing a backup will replace the current profile, readings, costs, and settings on this device.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const importedBackup = await storageService.importBackup(parsedBackup);
              if (importedBackup.appSettings.reminderEnabled && importedBackup.appSettings.reminderTime) {
                await notificationService.enableDailyReminder(importedBackup.appSettings.reminderTime);
              } else {
                await notificationService.disableDailyReminder();
              }
              await rehydrateAllStores();
              setStatusMessage('Backup imported successfully.');
            })().catch((error: unknown) => {
              const message = error instanceof Error ? error.message : 'Unable to import backup.';
              Alert.alert('Import failed', message);
            });
          },
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read backup file.';
      Alert.alert('Import failed', message);
    }
  };

  const deleteAllReadings = () => {
    Alert.alert('Delete all readings?', 'This removes every saved reading but keeps your system profile, costs, and display settings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete readings',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await setReadings([]);
            setStatusMessage('All readings were deleted.');
          })();
        },
      },
    ]);
  };

  const resetApplication = () => {
    Alert.alert('Reset WattTrack?', 'This will delete the profile, readings, costs, settings, and reminder schedule from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset app',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await notificationService.disableDailyReminder();
            await storageService.clearAllData();
            await rehydrateAllStores();
            setStatusMessage('WattTrack was reset to a clean state.');
            router.replace('/onboarding');
          })().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Unable to reset the app.';
            Alert.alert('Reset failed', message);
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={contentContainerStyle}
    >
      <MotionSection index={0}>
        <Panel tone="inverse" style={{ backgroundColor: theme.header }}>
          <SectionTitle title="More" description="Controls, reminders, backups, and profile access in one place." icon="ellipsis-horizontal" />
          <MenuRow
            icon="person-outline"
            title={systemProfile?.systemName ?? 'WattTrack profile'}
            subtitle={systemProfile?.location ?? 'Set your location'}
            action={<AppButton label="Edit" icon="create-outline" tone="ghost" fullWidth={false} onPress={() => router.push('/onboarding')} />}
          />
        </Panel>
      </MotionSection>

      <MotionSection index={1}>
        <Panel>
          <SectionTitle title="Profile details" description="Quick review of the system you are tracking." icon="settings-outline" />
          <MenuRow icon="settings-outline" title="Timezone" subtitle={systemProfile?.timezone ?? 'Asia/Manila'} />
          <MenuRow icon="settings-outline" title="Initial system cost" subtitle={formatCurrency(systemProfile?.initialSystemCost ?? 0)} />
          <MenuRow icon="settings-outline" title="Default import rate" subtitle={formatRate(systemProfile?.defaultImportRate ?? 0)} />
          <MenuRow icon="settings-outline" title="Grid input mode" subtitle={formatReadingMode(systemProfile?.gridInputMode)} />
          <MenuRow icon="settings-outline" title="Export mode" subtitle={formatExportMode(systemProfile?.exportInputMode)} />
        </Panel>
      </MotionSection>

      <MotionSection index={2}>
        <Panel>
          <SectionTitle title="Display" description="Tune how the energy console looks and formats values." icon="settings-outline" />
          <SegmentedControl options={themeOptions} value={themePreference} onChange={setThemePreference} />
          <SegmentedControl
            options={decimalOptions.map((value) => ({ label: value, value }))}
            value={decimalPlaces}
            onChange={setDecimalPlaces}
          />
          <SegmentedControl options={dashboardPeriodOptions} value={defaultDashboardPeriod} onChange={setDefaultDashboardPeriod} />
          <AppButton label="Save display settings" icon="save-outline" onPress={() => void saveDisplaySettings()} />
        </Panel>
      </MotionSection>

      <MotionSection index={3}>
        <Panel>
          <SectionTitle title="Alerts & reminders" description="Schedule local reminders that open the Add tab." icon="notifications-outline" />
          <MenuRow
            icon="notifications-outline"
            title="Daily reminder"
            subtitle="Use HH:MM in 24-hour time."
            action={<Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: theme.accent }} />}
          />
          <TextInput
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="19:00"
            placeholderTextColor={theme.textSubtle}
            style={{
              borderRadius: 18,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              color: theme.text,
              padding: 14,
            }}
          />
          <AppButton label="Save reminder" icon="alarm-outline" onPress={() => void saveReminderSettings()} />
        </Panel>
      </MotionSection>

      <MotionSection index={4}>
        <Panel>
          <SectionTitle title="Data" description="Export, import, and clean local data." icon="download-outline" />
          <View style={{ gap: 12 }}>
            <AppButton label="Export readings CSV" icon="download-outline" onPress={() => void exportCsv()} />
            <AppButton label="Export JSON backup" icon="archive-outline" tone="secondary" onPress={() => void exportBackup()} />
            <AppButton label="Import JSON backup" icon="cloud-upload-outline" tone="secondary" onPress={() => void importBackup()} />
            <AppButton label="Delete all readings" icon="trash-outline" tone="danger" onPress={deleteAllReadings} />
          </View>
        </Panel>
      </MotionSection>

      <MotionSection index={5}>
        <Panel>
          <SectionTitle title="Safety" description="Local storage notes and full reset controls." icon="shield-checkmark-outline" />
          <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
            WattTrack stores data only on this device. Create a backup before uninstalling, clearing app data, or moving devices.
          </Text>
          <AppButton label="Reset application" icon="refresh-outline" tone="danger" onPress={resetApplication} />
        </Panel>
      </MotionSection>

      {statusMessage ? (
        <MotionSection index={6}>
          <Panel tone="accent" padding={16}>
            <Text style={{ color: theme.statusText, fontSize: 14, fontWeight: '800' }}>{statusMessage}</Text>
          </Panel>
        </MotionSection>
      ) : null}
    </ScrollView>
  );
}
