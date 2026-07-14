import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { deletionAffectsLaterCumulativeReadings } from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatShortDate } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';
import { getWarningLabel } from '@/utils/readingWarnings';

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 15 }}>{value}</Text>
    </View>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        gap: 14,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: theme.surface,
        padding: 16,
        boxShadow: theme.shadow,
      }}
    >
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>{title}</Text>
      {children}
    </View>
  );
}

export default function ReadingDetailScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ readingId: string }>();
  const readings = useReadingsStore((state) => state.readings);
  const deleteReading = useReadingsStore((state) => state.deleteReading);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const { formatCurrency, formatKwh, formatRate } = useAppFormatters();

  const reading = readings.find((entry) => entry.id === params.readingId);

  const confirmDelete = () => {
    if (!reading || !systemProfile) {
      return;
    }

    const affectsLaterReadings = deletionAffectsLaterCumulativeReadings({
      readings,
      reading,
      profile: systemProfile,
    });

    Alert.alert(
      'Delete reading?',
      affectsLaterReadings
        ? 'This reading affects later cumulative calculations. WattTrack will recalculate later entries after deletion.'
        : 'This action permanently removes the reading from local storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteReading(reading.id, systemProfile).then(() => {
              router.replace('/(tabs)/history');
            });
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: reading ? formatShortDate(reading.date) : 'Reading detail' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ gap: 16, padding: 20, paddingBottom: 40 }}
      >
        {!reading ? (
          <DetailCard title="Reading not found">
            <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>
              This entry is no longer available. It may have been deleted or replaced by a restored backup.
            </Text>
          </DetailCard>
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>{formatShortDate(reading.date)}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 15 }}>
                {reading.time ? `${reading.time} | ` : ''}Review original values, derived totals, and local audit timestamps.
              </Text>
            </View>

            {reading.warningCodes?.length ? (
              <DetailCard title="Warnings">
                {reading.warningCodes.map((warning) => (
                  <Text key={warning} style={{ color: theme.warningText, fontSize: 14, lineHeight: 20 }}>
                    {getWarningLabel(warning)}
                  </Text>
                ))}
              </DetailCard>
            ) : null}

            <DetailCard title="Original entered values">
              <DetailRow label="Grid meter/input" value={typeof reading.gridReading === 'number' ? formatKwh(reading.gridReading) : 'Not provided'} />
              <DetailRow label="Solar meter/input" value={typeof reading.solarReading === 'number' ? formatKwh(reading.solarReading) : 'Not provided'} />
              <DetailRow label="Export meter/input" value={typeof reading.exportReading === 'number' ? formatKwh(reading.exportReading) : 'Not provided'} />
              <DetailRow label="Meter reset" value={reading.meterReset ? 'Yes' : 'No'} />
            </DetailCard>

            <DetailCard title="Derived daily values">
              <DetailRow label="Grid consumption" value={formatKwh(reading.gridConsumptionKwh)} />
              <DetailRow label="Solar generation" value={formatKwh(reading.solarGenerationKwh)} />
              <DetailRow label="Exported energy" value={formatKwh(reading.exportedEnergyKwh)} />
              <DetailRow label="Self-consumed solar" value={formatKwh(reading.selfConsumedSolarKwh)} />
              <DetailRow label="Estimated home usage" value={formatKwh(reading.estimatedHomeUsageKwh)} />
            </DetailCard>

            <DetailCard title="Rates and savings">
              <DetailRow label="Import rate used" value={formatRate(reading.importRate)} />
              <DetailRow label="Export rate used" value={typeof reading.exportRate === 'number' ? formatRate(reading.exportRate) : 'Disabled'} />
              <DetailRow label="Estimated savings" value={formatCurrency(reading.estimatedSavings)} />
              <DetailRow label="Estimated grid cost" value={formatCurrency(reading.estimatedGridCost)} />
            </DetailCard>

            <DetailCard title="Notes and audit trail">
              <DetailRow label="Notes" value={reading.notes?.trim() ? reading.notes : 'No notes'} />
              <DetailRow label="Created" value={formatTimestamp(reading.createdAt)} />
              <DetailRow label="Last edited" value={formatTimestamp(reading.updatedAt)} />
            </DetailCard>

            <View style={{ gap: 12 }}>
              <Pressable
                onPress={() => router.push({ pathname: '/readings/edit/[readingId]', params: { readingId: reading.id } })}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: theme.accent,
                  padding: 16,
                }}
              >
                <Text style={{ color: theme.textOnDark, fontSize: 16, fontWeight: '800' }}>Edit reading</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/add', params: { duplicateId: reading.id } })}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: theme.neutralSoft,
                  padding: 16,
                }}
              >
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Duplicate into new reading</Text>
              </Pressable>

              <Pressable
                onPress={confirmDelete}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: theme.dangerSoft,
                  padding: 16,
                }}
              >
                <Text style={{ color: theme.dangerText, fontSize: 16, fontWeight: '800' }}>Delete reading</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}
