import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AppButton, IconBadge, MotionSection, Panel, SectionTitle, useScreenContentContainerStyle } from '@/components/app-ui';
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

export default function DataScreen() {
  const theme = useAppTheme();
  const contentContainerStyle = useScreenContentContainerStyle({ topPadding: 14 });
  const readings = useReadingsStore((state) => state.readings);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const costs = useCostsStore((state) => state.costs);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const backupSummary = `${readings.length} readings · ${costs.length} costs · ${systemProfile ? '1 profile' : '0 profiles'}`;

  const rehydrateAllStores = async () => {
    await Promise.all([hydrateSystem(), hydrateSettings(), hydrateReadings(), hydrateCosts()]);
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

  const importData = async () => {
    try {
      const payload = await exportService.pickBackupContents();
      if (!payload) {
        return;
      }

      const importedBackup = await storageService.importBackup(payload);
      if (importedBackup.appSettings.reminderEnabled && importedBackup.appSettings.reminderTime) {
        await notificationService.enableDailyReminder(importedBackup.appSettings.reminderTime);
      } else {
        await notificationService.disableDailyReminder();
      }
      await rehydrateAllStores();
      Alert.alert('Import complete', 'Your WattTrack backup was restored.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import backup.';
      Alert.alert('Import failed', message);
    }
  };

  const exportData = async () => {
    try {
      const result = await exportService.exportBackupFile();
      Alert.alert('Export complete', `Backup exported as ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export backup.';
      Alert.alert('Export failed', message);
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

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical
      overScrollMode="always"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={contentContainerStyle}
    >
      <MotionSection index={0}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              height: 44,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: theme.text, fontSize: 28, fontFamily: fontFamilies.display }}>Data</Text>
            <Text style={{ color: theme.textSubtle, fontSize: 13, fontFamily: fontFamilies.body }}>
              Export, restore, or reset local WattTrack records.
            </Text>
          </View>
        </View>
      </MotionSection>

      <MotionSection index={1}>
        <Panel>
          <SectionTitle title="Current data" description="Everything is stored locally on this device." icon="server-outline" />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              padding: 16,
            }}
          >
            <IconBadge icon="analytics-outline" />
            <Text style={{ flex: 1, color: theme.textMuted, fontSize: 14, lineHeight: 20, fontFamily: fontFamilies.bodyStrong }}>
              {backupSummary}
            </Text>
          </View>
        </Panel>
      </MotionSection>

      <MotionSection index={2}>
        <Panel>
          <SectionTitle title="Export & restore" description="Move your records or keep an offline copy." icon="download-outline" />
          <View style={{ gap: 12 }}>
            <AppButton label="Create backup" icon="archive-outline" onPress={() => void createBackup()} />
            <AppButton label="Export JSON backup" icon="cloud-upload-outline" tone="secondary" onPress={() => void exportData()} />
            <AppButton label="Export readings CSV" icon="document-text-outline" tone="secondary" onPress={() => void exportCsv()} />
            <AppButton label="Import backup" icon="download-outline" tone="secondary" onPress={() => void importData()} />
          </View>
        </Panel>
      </MotionSection>

      <MotionSection index={3}>
        <Panel tone="accent">
          <SectionTitle title="Recent local backups" description="This list only tracks backups created during the current app session." icon="time-outline" />
          {backups.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20, fontFamily: fontFamilies.body }}>
              No backups created in this session yet.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {backups.map((backup) => (
                <View
                  key={backup.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    padding: 14,
                  }}
                >
                  <IconBadge icon="checkmark-circle-outline" size={38} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
                      {formatBackupDate(backup.createdAt)}
                    </Text>
                    <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>
                      {backup.summary}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Panel>
      </MotionSection>

      <MotionSection index={4}>
        <Panel>
          <SectionTitle title="Danger zone" description="Resetting cannot be undone without a backup." icon="warning-outline" />
          <AppButton label="Reset all data" icon="trash-outline" tone="danger" onPress={resetData} />
        </Panel>
      </MotionSection>
    </ScrollView>
  );
}
