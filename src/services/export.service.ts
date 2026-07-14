import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

function createTextFile(filename: string, contents: string): File {
  const file = new File(Paths.cache, filename);
  file.create({ intermediates: true, overwrite: true });
  file.write(contents);
  return file;
}

async function shareFile(file: File, mimeType: string, dialogTitle: string): Promise<string> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      dialogTitle,
      UTI: mimeType,
    });
  }

  return file.uri;
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
    const file = createTextFile(filename, csv);
    const fileUri = await shareFile(file, 'text/csv', 'Export WattTrack readings');
    return { fileUri, filename };
  },

  async exportBackupFile(): Promise<{ backup: WattTrackBackup; fileUri: string; filename: string }> {
    const backup = await storageService.exportBackup();
    const filename = `watttrack-backup-${buildTimestampForFilename()}.json`;
    const file = createTextFile(filename, JSON.stringify(backup, null, 2));
    const fileUri = await shareFile(file, 'application/json', 'Export WattTrack backup');
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

    const file = new File(result.assets[0].uri);
    return file.text();
  },
};
