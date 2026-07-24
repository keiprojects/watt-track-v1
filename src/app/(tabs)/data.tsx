import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { CommandButton, IconSquare, ScreenHeader, ScreenScroll, SectionHeader, SoftCard, wattGradients } from '@/components/watt-ui';
import { useRehydrateAppStores } from '@/hooks/use-rehydrate-app-stores';
import { exportService } from '@/services/export.service';
import { resetLocalAppData } from '@/services/local-data.service';
import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';
import { useBillingCyclesStore } from '@/stores/billing-cycles.store';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { LocalBackupSnapshot, WattTrackBackup } from '@/types/backup';
import { getErrorMessage, runAlertedAction } from '@/utils/alerts';
import { formatDateTimeLabel } from '@/utils/date';

type RestoreMode = 'replace' | 'merge';

export default function DataScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const cycleOverrides = useBillingCyclesStore((state) => state.cycleOverrides);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const rehydrateAllStores = useRehydrateAppStores();
  const [backups, setBackups] = useState<LocalBackupSnapshot[]>([]);
  const backupSummary = `${readings.length} readings | ${costs.length} costs | ${cycleOverrides.length} bill cycles | ${systemProfile ? '1 profile' : '0 profiles'}`;

  useEffect(() => {
    void storageService
      .getLocalBackups()
      .then(setBackups)
      .catch((error: unknown) => {
        if (__DEV__) {
          console.error('Failed to load local backups.', error);
        }
      });
  }, []);

  const restoreBackup = async (backup: string | WattTrackBackup, mode: RestoreMode) => {
    try {
      const importedBackup = await storageService.importBackup(backup, mode);
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
        'Restore complete',
        reminderWarning
          ? `Your WattTrack backup was restored, but daily reminders were turned off. ${reminderWarning}`
          : 'Your WattTrack backup was restored.',
      );
    } catch (error) {
      Alert.alert('Restore failed', getErrorMessage(error, 'Unable to restore backup.'));
    }
  };

  const showRestoreOptions = (backup: string | WattTrackBackup) => {
    Alert.alert(
      'Restore backup?',
      'Merge data keeps records created on this device and combines them with the backup. Replace data deletes current app data and restores the backup only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace data',
          style: 'destructive',
          onPress: () => {
            void restoreBackup(backup, 'replace');
          },
        },
        {
          text: 'Merge data',
          onPress: () => {
            void restoreBackup(backup, 'merge');
          },
        },
      ],
    );
  };

  const restoreFromFile = async () => {
    await runAlertedAction({
      errorTitle: 'Restore failed',
      errorFallback: 'Unable to select backup file.',
      action: async () => {
        const payload = await exportService.pickBackupContents();
        if (payload) {
          showRestoreOptions(payload);
        }
      },
    });
  };

  const createBackup = async () => {
    await runAlertedAction({
      errorTitle: 'Backup failed',
      errorFallback: 'Unable to create backup.',
      action: async () => {
        const backup = await storageService.createLocalBackup();
        await exportService.exportBackupFile(backup.backup);
        setBackups(await storageService.getLocalBackups());
      },
      onSuccess: () => {
        Alert.alert('Backup created', 'A local restore point was saved and a WattTrack backup file was created.');
      },
    });
  };

  const exportCsv = async () => {
    await runAlertedAction({
      errorTitle: 'Export failed',
      errorFallback: 'Unable to export CSV.',
      action: async () => {
        const result = await exportService.exportReadingsCsv(readings);
        Alert.alert('CSV exported', `Readings exported as ${result.filename}.`);
      },
    });
  };

  const resetData = () => {
    Alert.alert('Reset all WattTrack data?', 'This removes your profile, readings, costs, settings, and reminder schedule from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset data',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await resetLocalAppData();
            await rehydrateAllStores();
            router.replace('/onboarding');
          })().catch((error: unknown) => {
            Alert.alert('Reset failed', getErrorMessage(error, 'Unable to reset data.'));
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
        <CommandButton label="Create backup" icon="archive-outline" tone="primary" onPress={() => void createBackup()} />
        <CommandButton label="Export readings CSV" icon="document-text-outline" onPress={() => void exportCsv()} />
        <CommandButton
          label="Restore latest local backup"
          icon="reload-outline"
          disabled={backups.length === 0}
          onPress={() => {
            if (backups[0]) {
              showRestoreOptions(backups[0].backup);
            }
          }}
        />
        <CommandButton label="Restore from file" icon="download-outline" onPress={() => void restoreFromFile()} />
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Recent local backups" />
        <SoftCard>
          {backups.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
              Local restore points will appear here after you create a backup.
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {backups.map((backup) => (
                <Pressable
                  key={backup.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Restore backup from ${formatDateTimeLabel(backup.createdAt)}`}
                  onPress={() => showRestoreOptions(backup.backup)}
                  style={({ pressed }) => ({ gap: 4, opacity: pressed ? 0.72 : 1 })}
                >
                  <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>
                    {formatDateTimeLabel(backup.createdAt)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>{backup.summary}</Text>
                  <Text style={{ color: theme.accent, fontSize: 12, fontFamily: fontFamilies.bodyHeavy }}>Restore backup</Text>
                </Pressable>
              ))}
            </View>
          )}
        </SoftCard>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Danger Zone" />
        <CommandButton label="Reset all data" icon="trash-outline" tone="danger" onPress={resetData} />
      </View>
    </ScreenScroll>
  );
}
