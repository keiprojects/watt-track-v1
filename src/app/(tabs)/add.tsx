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
          ? 'Start from a prior entry, adjust the details you need, and save the updated snapshot.'
          : 'Log the meter values you can see right now and let WattTrack update your energy picture.'
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
