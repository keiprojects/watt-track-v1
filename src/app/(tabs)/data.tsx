import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { IconSquare, ScreenHeader, ScreenScroll, SectionHeader, SoftCard, wattGradients } from '@/components/watt-ui';
import { exportService } from '@/services/export.service';
import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type BackupEntry = {
  id: string;
  createdAt: Date;
  summary: string;
};

function formatBackupDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function DataButton({
  label,
  icon,
  onPress,
  tone = 'default',
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
}) {
  const theme = useAppTheme();
  const primary = tone === 'primary';
  const danger = tone === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        borderRadius: 14,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: primary ? theme.accent : danger ? theme.dangerSoft : theme.border,
        backgroundColor: primary ? theme.accent : danger ? theme.dangerSoft : theme.surface,
        opacity: pressed ? 0.74 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={primary ? '#ffffff' : danger ? theme.dangerText : theme.accent} />
      <Text style={{ color: primary ? '#ffffff' : danger ? theme.dangerText : theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function DataScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const costs = useCostsStore((state) => state.costs);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const backupSummary = `${readings.length} readings | ${costs.length} costs | ${systemProfile ? '1 profile' : '0 profiles'}`;

  const rehydrateAllStores = async () => {
    await Promise.all([hydrateSystem(), hydrateSettings(), hydrateReadings(), hydrateCosts()]);
  };

  const importData = async () => {
    try {
      const payload = await exportService.pickBackupContents();
      if (!payload) {
        return;
      }

      const importedBackup = await storageService.importBackup(payload);
      let reminderWarning: string | null = null;

      if (importedBackup.appSettings.reminderEnabled && importedBackup.appSettings.reminderTime) {
        try {
          await notificationService.enableDailyReminder(importedBackup.appSettings.reminderTime);
        } catch (reminderError) {
          reminderWarning = reminderError instanceof Error ? reminderError.message : 'Daily reminders could not be restored.';
          await storageService.saveAppSettings({
            ...importedBackup.appSettings,
            reminderEnabled: false,
          });
        }
      } else {
        await notificationService.disableDailyReminder();
      }
      await rehydrateAllStores();
      Alert.alert(
        'Import complete',
        reminderWarning
          ? `Your WattTrack backup was restored, but daily reminders were turned off. ${reminderWarning}`
          : 'Your WattTrack backup was restored.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import backup.';
      Alert.alert('Import failed', message);
    }
  };

  const createBackup = async () => {
    try {
      await exportService.exportBackupFile();
      const createdAt = new Date();
      setBackups((current) => [{ id: createdAt.toISOString(), createdAt, summary: backupSummary }, ...current]);
      Alert.alert('Backup created', 'A WattTrack backup file was created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create backup.';
      Alert.alert('Backup failed', message);
    }
  };

  const exportCsv = async () => {
    try {
      const result = await exportService.exportReadingsCsv(readings);
      Alert.alert('CSV exported', `Readings exported as ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export CSV.';
      Alert.alert('Export failed', message);
    }
  };

  const resetData = () => {
    Alert.alert('Reset all WattTrack data?', 'This removes your profile, readings, costs, settings, and reminder schedule from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset data',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await notificationService.disableDailyReminder();
            await storageService.clearAllData();
            await rehydrateAllStores();
            router.replace('/onboarding');
          })().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Unable to reset data.';
            Alert.alert('Reset failed', message);
          });
        },
      },
    ]);
  };

  return (
    <ScreenScroll gap={18}>
      <ScreenHeader title="Backup & Export" leftIcon="chevron-back" leftLabel="Back" onLeftPress={() => router.push('/(tabs)/settings')} />

      <SoftCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IconSquare icon="cloud-upload" colors={wattGradients.blue} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.text, fontSize: 17, fontFamily: fontFamilies.bodyHeavy }}>Current data</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>{backupSummary}</Text>
        </View>
      </SoftCard>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Export & Restore" />
        <DataButton label="Create backup" icon="archive-outline" tone="primary" onPress={() => void createBackup()} />
        <DataButton label="Export readings CSV" icon="document-text-outline" onPress={() => void exportCsv()} />
        <DataButton label="Import backup" icon="download-outline" onPress={() => void importData()} />
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Recent local backups" />
        <SoftCard>
          {backups.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
              Backups created in this session will appear here.
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {backups.map((backup) => (
                <View key={backup.id} style={{ gap: 3 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>
                    {formatBackupDate(backup.createdAt)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>{backup.summary}</Text>
                </View>
              ))}
            </View>
          )}
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Danger Zone" />
        <DataButton label="Reset all data" icon="trash-outline" tone="danger" onPress={resetData} />
      </View>
    </ScreenScroll>
  );
}
