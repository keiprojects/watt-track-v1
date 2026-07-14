import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { exportService } from '@/services/export.service';
import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import type { AppTheme, DashboardPeriod } from '@/types/settings';
import { useAppFormatters } from '@/utils/format';

const themeOptions: { label: string; value: AppTheme }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const dashboardPeriodOptions: { label: string; value: DashboardPeriod }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
];

const decimalOptions = ['0', '1', '2', '3'] as const;

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        gap: 14,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: '#ffffff',
        padding: 18,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>{title}</Text>
        {description ? <Text style={{ color: '#475569', fontSize: 14, lineHeight: 21 }}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function SegmentedRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              minWidth: 78,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: selected ? '#0f766e' : '#cbd5e1',
              backgroundColor: selected ? '#ccfbf1' : '#ffffff',
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: selected ? '#115e59' : '#334155', fontSize: 14, fontWeight: '700' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
}) {
  const palette =
    tone === 'danger'
      ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
      : tone === 'secondary'
        ? { backgroundColor: '#e2e8f0', color: '#0f172a' }
        : { backgroundColor: '#0f766e', color: '#f0fdfa' };

  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: palette.backgroundColor,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: palette.color, fontSize: 15, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
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

  const [theme, setTheme] = useState<AppTheme>(settings.theme);
  const [decimalPlaces, setDecimalPlaces] = useState(String(settings.decimalPlaces));
  const [defaultDashboardPeriod, setDefaultDashboardPeriod] = useState<DashboardPeriod>(settings.defaultDashboardPeriod);
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime ?? '19:00');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setTheme(settings.theme);
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
      theme,
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
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>Settings</Text>

      <SettingsCard title="System settings" description="Review your saved solar setup and reopen onboarding to edit the profile.">
        <Text style={{ color: '#334155', fontSize: 15 }}>System name: {systemProfile?.systemName ?? 'Not set'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Timezone: {systemProfile?.timezone ?? 'Asia/Manila'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Currency: PHP</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>
          Initial system cost: {formatCurrency(systemProfile?.initialSystemCost ?? 0)}
        </Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>
          Default import rate: {formatRate(systemProfile?.defaultImportRate ?? 0)}
        </Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Grid input mode: {systemProfile?.gridInputMode ?? 'cumulative'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Solar input mode: {systemProfile?.solarInputMode ?? 'cumulative'}</Text>
        <Text style={{ color: '#334155', fontSize: 15 }}>Export mode: {systemProfile?.exportInputMode ?? 'disabled'}</Text>
        <ActionButton label="Edit system profile" onPress={() => router.push('/onboarding')} tone="secondary" />
      </SettingsCard>

      <SettingsCard title="Display settings" description="Keep formatting and dashboard defaults consistent on this device.">
        <View style={{ gap: 8 }}>
          <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '700' }}>Theme</Text>
          <SegmentedRow options={themeOptions} value={theme} onChange={setTheme} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '700' }}>Decimal places</Text>
          <SegmentedRow
            options={decimalOptions.map((value) => ({ label: value, value }))}
            value={decimalPlaces}
            onChange={setDecimalPlaces}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '700' }}>Default dashboard period</Text>
          <SegmentedRow options={dashboardPeriodOptions} value={defaultDashboardPeriod} onChange={setDefaultDashboardPeriod} />
        </View>

        <ActionButton label="Save display settings" onPress={() => void saveDisplaySettings()} />
      </SettingsCard>

      <SettingsCard title="Daily reminder" description="Schedule a local reminder that opens the Add tab when the notification is tapped.">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#f8fafc',
            padding: 14,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '700' }}>Enable reminder</Text>
            <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18 }}>Use HH:MM in 24-hour time.</Text>
          </View>
          <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: '#0f766e' }} />
        </View>

        <TextInput
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="19:00"
          autoCapitalize="none"
          style={{
            borderRadius: 8,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: '#cbd5e1',
            backgroundColor: '#ffffff',
            padding: 14,
          }}
        />

        <ActionButton label="Save reminder" onPress={() => void saveReminderSettings()} />
      </SettingsCard>

      <SettingsCard title="Data settings" description="Export your readings, back up the full app state, or restore from a prior JSON backup.">
        <ActionButton label="Export readings CSV" onPress={() => void exportCsv()} />
        <ActionButton label="Export JSON backup" onPress={() => void exportBackup()} tone="secondary" />
        <ActionButton label="Import JSON backup" onPress={() => void importBackup()} tone="secondary" />
        <ActionButton label="Delete all readings" onPress={deleteAllReadings} tone="danger" />
      </SettingsCard>

      <SettingsCard title="Information">
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          WattTrack stores information only on this device. Removing the app, clearing application data, or losing the device may permanently delete your
          records unless you create a backup.
        </Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          Reset clears the profile, costs, readings, and local preferences, then sends you back to onboarding.
        </Text>
        <ActionButton label="Reset application" onPress={resetApplication} tone="danger" />
      </SettingsCard>

      {statusMessage ? (
        <View
          style={{
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#ecfeff',
            padding: 16,
          }}
        >
          <Text style={{ color: '#155e75', fontSize: 14, fontWeight: '700' }}>{statusMessage}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
