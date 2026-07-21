import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { exportService } from '@/services/export.service';
import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { fontFamilies } from '@/theme/typography';

const colors = {
  background: '#101011',
  header: '#1f1d23',
  divider: 'rgba(255, 255, 255, 0.16)',
  rowPressed: 'rgba(255, 255, 255, 0.06)',
  text: '#eceaf1',
  muted: '#b7b5bf',
  subtle: '#77757f',
  accent: '#bcc2ff',
  warning: '#b50010',
  warningText: '#fee2e2',
} as const;

type DataRowProps = {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  accent?: boolean;
  onPress?: () => void;
};

type BackupEntry = {
  id: string;
  title: string;
  createdAt: Date;
  summary: string;
};

function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        minHeight: 76 + insets.top,
        paddingTop: insets.top,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 26,
        backgroundColor: colors.header,
      }}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
        <Ionicons name="arrow-back" size={36} color={colors.muted} />
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 32, fontFamily: fontFamilies.displayMedium }}>Data</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ color: colors.accent, fontSize: 23, fontFamily: fontFamilies.bodyStrong, paddingHorizontal: 34, paddingTop: 28, paddingBottom: 14 }}>{title}</Text>;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

function DataRow({ icon, title, subtitle, accent = false, onPress }: DataRowProps) {
  const content = (
    <View
      style={{
        minHeight: 86,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        paddingHorizontal: 34,
      }}
    >
      <View style={{ width: 50, alignItems: 'center' }}>
        <Ionicons name={icon} size={31} color={accent ? colors.accent : colors.muted} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: accent ? colors.accent : colors.text, fontSize: 22, fontFamily: fontFamilies.body }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.muted, fontSize: 18, lineHeight: 24, fontFamily: fontFamilies.body }}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ backgroundColor: pressed ? colors.rowPressed : 'transparent' })}>
      {content}
    </Pressable>
  );
}

function WarningBanner() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: colors.warning, paddingHorizontal: 34, paddingVertical: 16 }}>
      <Ionicons name="alert-circle-outline" size={34} color={colors.warningText} />
      <Text style={{ flex: 1, color: colors.warningText, fontSize: 18, lineHeight: 24, fontFamily: fontFamilies.body }}>
        Backups and exported files are stored locally on your device. When you delete or reinstall the app, local files may be deleted.
      </Text>
    </View>
  );
}

function formatBackupDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DataScreen() {
  const readings = useReadingsStore((state) => state.readings);
  const hydrateReadings = useReadingsStore((state) => state.hydrate);
  const costs = useCostsStore((state) => state.costs);
  const hydrateCosts = useCostsStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateSystem = useSystemStore((state) => state.hydrate);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const backupSummary = `${readings.length} readings • ${costs.length} costs • ${systemProfile ? '1 profile' : '0 profiles'}`;

  const rehydrateAllStores = async () => {
    await Promise.all([hydrateSystem(), hydrateSettings(), hydrateReadings(), hydrateCosts()]);
  };

  const resetData = () => {
    Alert.alert('Reset data?', 'This removes your system profile, readings, costs, settings, and reminder schedule from this device.', [
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
      setBackups((current) => [
        {
          id: createdAt.toISOString(),
          title: 'Manual backup',
          createdAt,
          summary: backupSummary,
        },
        ...current,
      ]);
      Alert.alert('Backup created', 'A backup file was created and shared from this device.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create backup.';
      Alert.alert('Backup failed', message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} alwaysBounceVertical={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <DataRow icon="refresh-outline" title="Reset data" onPress={resetData} />
        <Divider />

        <SectionTitle title="Export" />
        <DataRow icon="download-outline" title="Import data" onPress={() => void importData()} />
        <DataRow icon="cloud-upload-outline" title="Export data" onPress={() => void exportData()} />
        <DataRow icon="document-text-outline" title="Export data to CSV" onPress={() => void exportCsv()} />
        <Divider />

        <SectionTitle title="Backup data" />
        <WarningBanner />
        <DataRow icon="add-outline" title="Create backup" accent onPress={() => void createBackup()} />

        {backups.length === 0 ? (
          <DataRow icon="time-outline" title="No local backups yet" subtitle={`Current data: ${backupSummary}`} />
        ) : (
          backups.map((backup) => <DataRow key={backup.id} icon="time-outline" title={backup.title} subtitle={`${formatBackupDate(backup.createdAt)}\n${backup.summary}`} />)
        )}
      </ScrollView>
    </View>
  );
}
