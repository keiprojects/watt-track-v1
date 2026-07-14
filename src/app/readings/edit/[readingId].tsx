import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { ReadingForm } from '@/components/reading-form';
import { createReadingRecord, findPreviousReading, readingToDraft } from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import type { ReadingDraft } from '@/types/reading';

export default function EditReadingScreen() {
  const params = useLocalSearchParams<{ readingId: string }>();
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const readings = useReadingsStore((state) => state.readings);
  const updateReading = useReadingsStore((state) => state.updateReading);

  const reading = readings.find((entry) => entry.id === params.readingId);

  const handleSubmitDraft = async (draft: ReadingDraft) => {
    if (!systemProfile || !reading) {
      return;
    }

    const previousReading = findPreviousReading(
      readings.filter((entry) => entry.id !== reading.id),
      draft,
    );
    const updatedReading = {
      ...createReadingRecord({
        draft,
        profile: systemProfile,
        previousReading,
        id: reading.id,
        createdAt: reading.createdAt,
      }),
      updatedAt: new Date().toISOString(),
    };

    await updateReading(updatedReading, systemProfile);
    Alert.alert('Reading updated', 'Later cumulative readings have been recalculated where needed.');
    router.replace({ pathname: '/readings/[readingId]', params: { readingId: reading.id } });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Edit reading' }} />
      <ReadingForm
        title="Edit reading"
        description="Update the original entry. WattTrack will recompute later derived values in chronological order when cumulative modes depend on this reading."
        systemProfile={systemProfile}
        readings={readings}
        initialDraft={reading ? readingToDraft(reading) : undefined}
        duplicateDateIgnoreId={reading?.id}
        primaryActionLabel="Save changes"
        onSubmitDraft={async (draft, _options) => handleSubmitDraft(draft)}
        onCancel={() => router.back()}
      />
    </>
  );
}
