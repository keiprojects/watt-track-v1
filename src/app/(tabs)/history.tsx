import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Switch, Text, TextInput, View } from 'react-native';

import { useReadingsStore } from '@/stores/readings.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { EnergyReading } from '@/types/reading';
import { formatMonthLabel, formatShortDate } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

function FilterField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textSubtle}
        style={{
          borderRadius: 8,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surface,
          padding: 12,
          color: theme.text,
        }}
      />
    </View>
  );
}

function buildSections(readings: EnergyReading[]) {
  return readings.reduce<{ title: string; data: EnergyReading[] }[]>((grouped, reading) => {
    const title = formatMonthLabel(reading.date);
    const existingGroup = grouped.find((section) => section.title === title);

    if (existingGroup) {
      existingGroup.data.push(reading);
      return grouped;
    }

    return [...grouped, { title, data: [reading] }];
  }, []);
}

export default function HistoryScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const { formatCurrency, formatKwh } = useAppFormatters();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [notesOnly, setNotesOnly] = useState(false);
  const [warningsOnly, setWarningsOnly] = useState(false);

  const filteredReadings = useMemo(
    () =>
      readings.filter((reading) => {
        if (fromDate && reading.date < fromDate) {
          return false;
        }

        if (toDate && reading.date > toDate) {
          return false;
        }

        if (notesOnly && !reading.notes?.trim()) {
          return false;
        }

        if (warningsOnly && !reading.warningCodes?.length) {
          return false;
        }

        return true;
      }),
    [fromDate, notesOnly, readings, toDate, warningsOnly],
  );

  const sections = useMemo(() => buildSections(filteredReadings), [filteredReadings]);
  const hasActiveFilters = Boolean(fromDate || toDate || notesOnly || warningsOnly);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 40 }}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 8 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>History</Text>
            <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>
              Review saved entries, filter the timeline, and open any reading to edit, duplicate, or delete it safely.
            </Text>
          </View>

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
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>Filters</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <FilterField label="From date" value={fromDate} onChangeText={setFromDate} />
              <FilterField label="To date" value={toDate} onChangeText={setToDate} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: theme.surfaceMuted,
                  padding: 12,
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '700' }}>Notes only</Text>
                <Switch value={notesOnly} onValueChange={setNotesOnly} trackColor={{ true: theme.accent }} />
              </View>

              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: theme.surfaceMuted,
                  padding: 12,
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '700' }}>Warnings only</Text>
                <Switch value={warningsOnly} onValueChange={setWarningsOnly} trackColor={{ true: theme.accent }} />
              </View>
            </View>

            <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
              Showing {filteredReadings.length} of {readings.length} reading(s).
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View
          style={{
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: theme.surface,
            padding: 20,
            boxShadow: theme.shadow,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
            {hasActiveFilters ? 'No readings match these filters' : 'No readings yet'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 }}>
            {hasActiveFilters
              ? 'Adjust the date range, notes, or warning filters to widen the results.'
              : 'Once you save a reading, it will show up here by month with warnings and estimated savings.'}
          </Text>
        </View>
      }
      renderSectionHeader={({ section: { title } }) => (
        <Text style={{ color: theme.textMuted, fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 10 }}>{title}</Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/readings/[readingId]', params: { readingId: item.id } })}
          style={{
            gap: 8,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: theme.surface,
            padding: 16,
            marginBottom: 10,
            boxShadow: theme.shadow,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{formatShortDate(item.date)}</Text>
              {item.time ? <Text style={{ color: theme.textSubtle, fontSize: 13 }}>{item.time}</Text> : null}
            </View>
            {item.warningCodes?.length ? (
              <Text style={{ color: theme.warningText, fontSize: 12, fontWeight: '700' }}>{item.warningCodes.length} warning(s)</Text>
            ) : null}
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 14 }}>
            Solar {formatKwh(item.solarGenerationKwh)} | Grid {formatKwh(item.gridConsumptionKwh)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 14 }}>
            Estimated savings {formatCurrency(item.estimatedSavings)} | Grid cost {formatCurrency(item.estimatedGridCost)}
          </Text>
          {item.notes ? <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 18 }}>{item.notes}</Text> : null}
        </Pressable>
      )}
    />
  );
}
