import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { ReadingForm } from '@/components/reading-form';
import { createReadingRecord, findPreviousReadings, readingToDraft } from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import type { ReadingDraft } from '@/types/reading';
import { createId } from '@/utils/ids';

export default function AddReadingScreen() {
  const params = useLocalSearchParams<{ duplicateId?: string }>();
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const readings = useReadingsStore((state) => state.readings);
  const saveReading = useReadingsStore((state) => state.saveReading);

  const duplicatedReading = params.duplicateId ? readings.find((reading) => reading.id === params.duplicateId) : undefined;

  const handleSubmitDraft = async (draft: ReadingDraft, options: { stayOnForm: boolean }) => {
    if (!systemProfile) {
      return;
    }

    const createdAt = new Date().toISOString();
    const previousReadings = findPreviousReadings(readings, draft);
    const reading = createReadingRecord({
      draft,
      profile: systemProfile,
      previousReadings,
      id: createId('reading'),
      createdAt,
    });

    await saveReading(reading, systemProfile);

    if (options.stayOnForm) {
      Alert.alert('Reading saved', 'You can add another reading now.');
      return;
    }

    Alert.alert('Reading saved', 'Your dashboard and insights have been updated.');
    router.replace('/(tabs)');
  };

  return (
    <ReadingForm
      title={duplicatedReading ? 'Duplicate reading' : 'Add reading'}
      description={
        duplicatedReading
          ? 'Start from a prior entry, then adjust the date, time, or meter readings before saving. Later cumulative readings will be recalculated automatically.'
          : 'Log a system check whenever you want. Add a time for multiple entries on the same date. In cumulative mode, you can record one reading when PV starts and another when PV stops so WattTrack can calculate the day total from the interval.'
      }
      systemProfile={systemProfile}
      readings={readings}
      initialDraft={duplicatedReading ? readingToDraft(duplicatedReading) : undefined}
      primaryActionLabel="Save reading"
      secondaryActionLabel="Save & add another"
      onSubmitDraft={handleSubmitDraft}
    />
  );
}
