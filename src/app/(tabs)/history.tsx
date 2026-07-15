import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Switch, Text, TextInput, View } from 'react-native';

import {
  AppButton,
  IconBadge,
  MotionSection,
  OverlaySheet,
  Panel,
  SectionTitle,
  StatPill,
} from '@/components/app-ui';
import { TrendLineChart } from '@/components/trend-line-chart';
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
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textSubtle}
        style={{
          borderRadius: 16,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceRaised,
          padding: 14,
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
  const { formatCurrency, formatKwh, formatPercent } = useAppFormatters();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [notesOnly, setNotesOnly] = useState(false);
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const warningCount = filteredReadings.filter((reading) => reading.warningCodes?.length).length;
  const trendReadings = useMemo(
    () => [...filteredReadings].sort((left, right) => left.date.localeCompare(right.date)).slice(-7),
    [filteredReadings],
  );
  const trendValues = useMemo(() => trendReadings.map((reading) => reading.estimatedHomeUsageKwh), [trendReadings]);
  const trendLabels = useMemo(
    () =>
      trendReadings.map((reading) =>
        new Intl.DateTimeFormat('en-PH', {
          weekday: 'short',
          timeZone: 'Asia/Manila',
        }).format(new Date(`${reading.date}T00:00:00`)),
      ),
    [trendReadings],
  );
  const latestReading = filteredReadings[0];
  const solarShare = latestReading?.estimatedHomeUsageKwh ? (latestReading.selfConsumedSolarKwh / latestReading.estimatedHomeUsageKwh) * 100 : 0;
  const gridShare = latestReading?.estimatedHomeUsageKwh ? (latestReading.gridConsumptionKwh / latestReading.estimatedHomeUsageKwh) * 100 : 0;

  return (
    <>
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ gap: 16, padding: 20, paddingBottom: 40 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 8 }}>
            <MotionSection index={0}>
              <Panel tone="inverse" style={{ backgroundColor: theme.header }}>
                <SectionTitle
                  title="History"
                  description="Your logged timeline in the reference app style, minus the clutter."
                  icon="time-outline"
                  action={
                    <AppButton
                      label="Filters"
                      icon="options-outline"
                      onPress={() => setFiltersOpen(true)}
                      tone="ghost"
                      fullWidth={false}
                    />
                  }
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <StatPill icon="albums-outline" label="Entries" value={String(filteredReadings.length)} tone="accent" />
                  <StatPill icon="warning-outline" label="Warnings" value={String(warningCount)} tone="warning" />
                  <StatPill icon="document-text-outline" label="Notes" value={String(filteredReadings.filter((reading) => reading.notes?.trim()).length)} />
                </View>
              </Panel>
            </MotionSection>

            {filteredReadings.length > 0 ? (
              <MotionSection index={1}>
                <Panel>
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '700' }}>
                      {latestReading ? formatShortDate(latestReading.date) : 'No date'}
                    </Text>
                    <Text selectable style={{ color: theme.text, fontSize: 38, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                      {formatKwh(latestReading?.estimatedHomeUsageKwh ?? 0)}
                    </Text>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                      {latestReading ? `${formatCurrency(latestReading.estimatedSavings)} estimated savings` : 'No savings yet'}
                    </Text>
                  </View>
                  <TrendLineChart
                    values={trendValues}
                    labels={trendLabels.length > 0 ? trendLabels : ['12A', '6A', '12P', '6P']}
                    callout={formatKwh(trendValues[Math.max(0, trendValues.length - 3)] ?? 0)}
                  />
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ height: 8, width: 8, borderRadius: 999, backgroundColor: theme.accent }} />
                        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Solar share</Text>
                      </View>
                      <Text selectable style={{ color: theme.accent, fontSize: 13, fontWeight: '800' }}>
                        {formatPercent(solarShare)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ height: 8, width: 8, borderRadius: 999, backgroundColor: '#f2a531' }} />
                        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Grid share</Text>
                      </View>
                      <Text selectable style={{ color: '#f2a531', fontSize: 13, fontWeight: '800' }}>
                        {formatPercent(gridShare)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ height: 8, width: 8, borderRadius: 999, backgroundColor: '#ff6b6b' }} />
                        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Grid cost</Text>
                      </View>
                      <Text selectable style={{ color: '#ff6b6b', fontSize: 13, fontWeight: '800' }}>
                        {formatCurrency(latestReading?.estimatedGridCost ?? 0)}
                      </Text>
                    </View>
                  </View>
                </Panel>
              </MotionSection>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <Panel>
            <SectionTitle
              title={hasActiveFilters ? 'No readings match these filters' : 'No readings yet'}
              description={
                hasActiveFilters
                  ? 'Adjust the current filters to widen the results.'
                  : 'Once you save a reading, it will show here with savings, warnings, and notes.'
              }
              icon="hourglass-outline"
            />
            <AppButton label="Add a reading" icon="add-circle-outline" onPress={() => router.push('/(tabs)/add')} />
          </Panel>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: '800', marginTop: 8, marginBottom: 10 }}>
            {title}
          </Text>
        )}
        renderItem={({ item, index }) => (
          <MotionSection index={index % 4}>
            <Pressable
              onPress={() => router.push({ pathname: '/readings/[readingId]', params: { readingId: item.id } })}
              style={({ pressed }) => ({
                gap: 12,
                borderRadius: 24,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                padding: 16,
                marginBottom: 12,
                boxShadow: theme.shadow,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <IconBadge
                    icon={item.warningCodes?.length ? 'warning-outline' : 'flash-outline'}
                    tone={item.warningCodes?.length ? 'warning' : 'accent'}
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{formatShortDate(item.date)}</Text>
                    <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
                      {item.time ? `${item.time} | ` : ''}
                      Solar {formatKwh(item.solarGenerationKwh)} | Grid {formatKwh(item.gridConsumptionKwh)}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ color: theme.accent, fontSize: 15, fontWeight: '800' }}>
                    {formatCurrency(item.estimatedSavings)}
                  </Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 12 }}>Savings</Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderRadius: 18,
                  borderCurve: 'continuous',
                  backgroundColor: theme.surfaceRaised,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>
                  Grid cost {formatCurrency(item.estimatedGridCost)}
                </Text>
                <Text style={{ color: item.warningCodes?.length ? theme.warningText : theme.textSubtle, fontSize: 12, fontWeight: '800' }}>
                  {item.warningCodes?.length ? `${item.warningCodes.length} warning(s)` : 'No warnings'}
                </Text>
              </View>

              {item.notes ? (
                <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 18 }}>{item.notes}</Text>
              ) : null}
            </Pressable>
          </MotionSection>
        )}
      />

      <OverlaySheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter timeline"
        description="Move filters out of the page so history stays focused on the readings themselves."
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <AppButton
              label="Reset"
              icon="refresh-outline"
              tone="secondary"
              fullWidth={false}
              style={{ flex: 1 }}
              onPress={() => {
                setFromDate('');
                setToDate('');
                setNotesOnly(false);
                setWarningsOnly(false);
              }}
            />
            <AppButton label="Done" icon="checkmark-outline" fullWidth={false} style={{ flex: 1 }} onPress={() => setFiltersOpen(false)} />
          </View>
        }
      >
        <FilterField label="From date" value={fromDate} onChangeText={setFromDate} />
        <FilterField label="To date" value={toDate} onChangeText={setToDate} />

        <Panel tone="muted" padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Notes only</Text>
              <Text style={{ color: theme.textSubtle, fontSize: 13 }}>Show entries with written notes.</Text>
            </View>
            <Switch value={notesOnly} onValueChange={setNotesOnly} trackColor={{ true: theme.accent }} />
          </View>
        </Panel>

        <Panel tone="muted" padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Warnings only</Text>
              <Text style={{ color: theme.textSubtle, fontSize: 13 }}>Focus on readings that need review.</Text>
            </View>
            <Switch value={warningsOnly} onValueChange={setWarningsOnly} trackColor={{ true: theme.accent }} />
          </View>
        </Panel>
      </OverlaySheet>
    </>
  );
}
