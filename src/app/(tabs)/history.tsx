import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateRangeFilterSheet } from '@/components/date-range-filter-sheet';
import { ScreenHeader, SoftCard } from '@/components/watt-ui';
import { aggregateReadingsByDate } from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { EnergyReading } from '@/types/reading';
import { formatMonthDayLabel, formatMonthLabel, formatShortDate, formatWeekdayLabel, isDateWithinRange } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

type MetricFilter = 'all' | 'grid' | 'solar' | 'export';

const metricFilters: { label: string; value: MetricFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Grid', value: 'grid' },
  { label: 'Solar', value: 'solar' },
  { label: 'Export', value: 'export' },
];

function formatCompactKwh(value: number): string {
  return value.toFixed(1);
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

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        minWidth: 68,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.border,
        backgroundColor: selected ? theme.accent : theme.surface,
        paddingHorizontal: 14,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text style={{ color: selected ? '#ffffff' : theme.text, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const readings = useReadingsStore((state) => state.readings);
  const { formatCurrency } = useAppFormatters();
  const [query, setQuery] = useState('');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredReadings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return readings.filter((reading) => {
      if (!isDateWithinRange(reading.date, fromDate || undefined, toDate || undefined)) {
        return false;
      }

      if (metricFilter === 'grid' && reading.gridConsumptionKwh <= 0) {
        return false;
      }

      if (metricFilter === 'solar' && reading.solarGenerationKwh <= 0) {
        return false;
      }

      if (metricFilter === 'export' && reading.exportedEnergyKwh <= 0) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        reading.date,
        reading.time,
        reading.notes,
        String(reading.gridConsumptionKwh),
        String(reading.solarGenerationKwh),
        String(reading.estimatedSavings),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [fromDate, metricFilter, query, readings, toDate]);

  const sections = useMemo(() => buildSections(filteredReadings), [filteredReadings]);
  const dailySummaries = useMemo(() => aggregateReadingsByDate(filteredReadings).slice(-8), [filteredReadings]);
  const totalSavings = filteredReadings.reduce((sum, reading) => sum + reading.estimatedSavings, 0);
  const lineData = dailySummaries.length
    ? dailySummaries.map((summary) => ({ value: summary.estimatedSavings }))
    : [{ value: 0 }, { value: 0 }, { value: 0 }];
  const chartWidth = Math.min(width - 190, 170);
  const hasDateFilter = Boolean(fromDate || toDate);

  return (
    <>
      <SectionList
        contentInsetAdjustmentBehavior="never"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          gap: 10,
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top + 12, 24),
          paddingBottom: 112 + insets.bottom,
        }}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 8 }}>
            <ScreenHeader
              title="History"
              rightIcon="calendar-outline"
              rightLabel="Filter date range"
              onRightPress={() => setFiltersOpen(true)}
            />

            <View
              style={{
                minHeight: 46,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderRadius: 16,
                borderCurve: 'continuous',
                backgroundColor: theme.surfaceMuted,
                paddingHorizontal: 14,
              }}
            >
              <Ionicons name="search-outline" size={18} color={theme.textSubtle} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search readings"
                placeholderTextColor={theme.textSubtle}
                style={{
                  flex: 1,
                  color: theme.text,
                  fontSize: 14,
                  fontFamily: fontFamilies.body,
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {metricFilters.map((filter) => (
                <FilterChip
                  key={filter.value}
                  label={filter.label}
                  selected={filter.value === metricFilter}
                  onPress={() => setMetricFilter(filter.value)}
                />
              ))}
              {hasDateFilter ? (
                <FilterChip
                  label="Date range"
                  selected
                  onPress={() => setFiltersOpen(true)}
                />
              ) : null}
            </View>

            <SoftCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>
                  {sections[0]?.title ?? 'Reading summary'}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>Total savings</Text>
                <Text selectable style={{ color: theme.statusText, fontSize: 25, fontFamily: fontFamilies.bodyHeavy }}>
                  {formatCurrency(totalSavings)}
                </Text>
              </View>
              <View style={{ pointerEvents: 'none', width: Math.max(120, chartWidth) }}>
                <LineChart
                  data={lineData}
                  width={Math.max(120, chartWidth)}
                  height={92}
                  curved
                  areaChart
                  hideAxesAndRules
                  hideDataPoints
                  disableScroll
                  color={theme.primaryChart}
                  startFillColor={theme.primaryChart}
                  endFillColor={theme.primaryChart}
                  startOpacity={0.24}
                  endOpacity={0.02}
                  thickness={2}
                  initialSpacing={0}
                  endSpacing={0}
                />
              </View>
            </SoftCard>
          </View>
        }
        ListEmptyComponent={
          <SoftCard>
            <Text style={{ color: theme.text, fontSize: 17, fontFamily: fontFamilies.bodyHeavy }}>No readings found</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
              Adjust the search, metric chip, or date range to widen the timeline.
            </Text>
          </SoftCard>
        }
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontFamily: fontFamilies.bodyHeavy }}>{title}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
              {data.length} reading{data.length === 1 ? '' : 's'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open reading from ${formatShortDate(item.date)}`}
            onPress={() => router.push({ pathname: '/readings/[readingId]', params: { readingId: item.id } })}
            style={({ pressed }) => ({
              minHeight: 76,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              paddingHorizontal: 14,
              marginBottom: 10,
              boxShadow: theme.shadow,
              opacity: pressed ? 0.78 : 1,
            })}
          >
            <View style={{ width: 48, gap: 2 }}>
              <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
                {formatMonthDayLabel(item.date)}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>{formatWeekdayLabel(item.date)}</Text>
            </View>
            <View
              style={{
                height: 38,
                width: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                backgroundColor: theme.warningSoft,
              }}
            >
              <Ionicons name="sunny" size={20} color={theme.warningText} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>
                {formatCompactKwh(item.solarGenerationKwh)}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>kWh solar</Text>
            </View>
            <View
              style={{
                height: 38,
                width: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                backgroundColor: theme.accentSoft,
              }}
            >
              <MaterialCommunityIcons name="transmission-tower" size={21} color={theme.accent} />
            </View>
            <View style={{ width: 54, gap: 2 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>
                {formatCompactKwh(item.gridConsumptionKwh)}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>kWh grid</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
          </Pressable>
        )}
      />

      <DateRangeFilterSheet
        visible={filtersOpen}
        title="Filter history"
        startDate={fromDate}
        endDate={toDate}
        onStartDateChange={setFromDate}
        onEndDateChange={setToDate}
        onApply={() => setFiltersOpen(false)}
        onReset={() => {
          setFromDate('');
          setToDate('');
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
