import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { storageService } from '@/services/storage.service';
import type { EnergyReading } from '@/types/reading';
import type { WattTrackBackup } from '@/types/backup';
import { sortReadingsAscending } from '@/utils/date';

function buildTimestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function escapeCsvValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  const stringValue = Array.isArray(value) ? value.join('|') : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function createTextFile(filename: string, contents: string): ExpoFile {
  const file = new ExpoFile(Paths.cache, filename);
  file.create({ intermediates: true, overwrite: true });
  file.write(contents);
  return file;
}

async function shareFile(file: ExpoFile, mimeType: string, dialogTitle: string): Promise<string> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      dialogTitle,
      UTI: mimeType,
    });
  }

  return file.uri;
}

function downloadTextFile(filename: string, contents: string, mimeType: string): string {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('File downloads are unavailable in this environment.');
  }

  const fileUri = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement('a');
  link.href = fileUri;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(fileUri);
  }, 30_000);

  return fileUri;
}

async function shareTextFile(filename: string, contents: string, mimeType: string, dialogTitle: string): Promise<string> {
  if (Platform.OS === 'web') {
    return downloadTextFile(filename, contents, mimeType);
  }

  const file = createTextFile(filename, contents);
  return shareFile(file, mimeType, dialogTitle);
}

async function readPickedBackupAsset(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (Platform.OS === 'web' && asset.file) {
    return asset.file.text();
  }

  const file = new ExpoFile(asset.uri);
  return file.text();
}

function buildReadingsCsv(readings: EnergyReading[]): string {
  const headers = [
    'id',
    'date',
    'time',
    'gridReading',
    'gridConsumptionKwh',
    'solarReading',
    'solarGenerationKwh',
    'exportReading',
    'exportedEnergyKwh',
    'selfConsumedSolarKwh',
    'estimatedHomeUsageKwh',
    'importRate',
    'exportRate',
    'estimatedSavings',
    'estimatedGridCost',
    'notes',
    'meterReset',
    'warningCodes',
    'createdAt',
    'updatedAt',
  ];

  const rows = sortReadingsAscending(readings).map((reading) =>
    [
      reading.id,
      reading.date,
      reading.time,
      reading.gridReading,
      reading.gridConsumptionKwh,
      reading.solarReading,
      reading.solarGenerationKwh,
      reading.exportReading,
      reading.exportedEnergyKwh,
      reading.selfConsumedSolarKwh,
      reading.estimatedHomeUsageKwh,
      reading.importRate,
      reading.exportRate,
      reading.estimatedSavings,
      reading.estimatedGridCost,
      reading.notes,
      reading.meterReset,
      reading.warningCodes,
      reading.createdAt,
      reading.updatedAt,
    ]
      .map(escapeCsvValue)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

export const exportService = {
  async exportReadingsCsv(readings: EnergyReading[]): Promise<{ fileUri: string; filename: string }> {
    const filename = `watttrack-readings-${buildTimestampForFilename()}.csv`;
    const csv = buildReadingsCsv(readings);
    const fileUri = await shareTextFile(filename, csv, 'text/csv', 'Export WattTrack readings');
    return { fileUri, filename };
  },

  async exportBackupFile(): Promise<{ backup: WattTrackBackup; fileUri: string; filename: string }> {
    const backup = await storageService.exportBackup();
    const filename = `watttrack-backup-${buildTimestampForFilename()}.json`;
    const fileUri = await shareTextFile(filename, JSON.stringify(backup, null, 2), 'application/json', 'Export WattTrack backup');
    return { backup, fileUri, filename };
  },

  async pickBackupContents(): Promise<string | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    return readPickedBackupAsset(result.assets[0]);
  },
};
