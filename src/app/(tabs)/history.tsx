import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateRangeFilterSheet } from '@/components/date-range-filter-sheet';
import { ScreenHeader, SoftCard } from '@/components/watt-ui';
import { aggregateReadingsByDate, getBillingCycleWindow, summarizeGridMeterReadings, summarizeReadings } from '@/services/calculation.service';
import { useBillingCyclesStore } from '@/stores/billing-cycles.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { BillingCycleOverride } from '@/types/billing';
import type { EnergyReading } from '@/types/reading';
import {
  formatMonthDayLabel,
  formatMonthLabel,
  formatShortDate,
  formatWeekdayLabel,
  getTodayDateInputValue,
  isDateWithinRange,
  sortReadingsAscending,
} from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

type MetricFilter = 'all' | 'grid' | 'solar' | 'export';
type BillCutoffItem = {
  type: 'bill-cutoff';
  id: string;
  sortDate: string;
  cycleStartDate: string;
  cycleEndDate: string;
  nextCycleStartDate: string;
  estimatedCost: number;
  gridKwh: number;
  rate: number;
  readingCount: number;
  hasOverride: boolean;
  basis: 'meter' | 'readings';
};
type ReadingHistoryItem = {
  type: 'reading';
  id: string;
  sortDate: string;
  reading: EnergyReading;
};
type HistoryItem = ReadingHistoryItem | BillCutoffItem;

const metricFilters: { label: string; value: MetricFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Grid', value: 'grid' },
  { label: 'Solar', value: 'solar' },
  { label: 'Export', value: 'export' },
];

function formatCompactKwh(value: number): string {
  return value.toFixed(1);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatEnergy(value: number): string {
  return `${formatCompactKwh(value)} kWh`;
}

function buildSections(items: HistoryItem[]) {
  return items.reduce<{ title: string; data: HistoryItem[] }[]>((grouped, item) => {
    const title = formatMonthLabel(item.sortDate);
    const existingGroup = grouped.find((section) => section.title === title);

    if (existingGroup) {
      existingGroup.data.push(item);
      return grouped;
    }

    return [...grouped, { title, data: [item] }];
  }, []);
}

function calculateBillEstimate({
  readings,
  fallbackRate,
  overrideRate,
  useGridMeter,
}: {
  readings: EnergyReading[];
  fallbackRate: number;
  overrideRate?: number;
  useGridMeter: boolean;
}) {
  if (useGridMeter) {
    const meterSummary = summarizeGridMeterReadings(readings);

    if (meterSummary.gridReadingCount >= 2) {
      const weightedRate =
        meterSummary.totalGridMeterConsumptionKwh === 0 ? fallbackRate : meterSummary.estimatedGridMeterCost / meterSummary.totalGridMeterConsumptionKwh;
      const rate = overrideRate ?? weightedRate;

      return {
        estimatedCost: roundMoney(meterSummary.totalGridMeterConsumptionKwh * rate),
        gridKwh: meterSummary.totalGridMeterConsumptionKwh,
        rate,
        basis: 'meter' as const,
        hasOverride: typeof overrideRate === 'number',
      };
    }
  }

  const readingSummary = summarizeReadings(readings);
  const weightedRate = readingSummary.gridConsumedKwh === 0 ? fallbackRate : readingSummary.estimatedGridCost / readingSummary.gridConsumedKwh;
  const rate = overrideRate ?? weightedRate;

  return {
    estimatedCost: roundMoney(readingSummary.gridConsumedKwh * rate),
    gridKwh: readingSummary.gridConsumedKwh,
    rate,
    basis: 'readings' as const,
    hasOverride: typeof overrideRate === 'number',
  };
}

function buildBillCutoffItems({
  readings,
  dateScopedReadings,
  cycleOverrides,
  billingCycleStartDay,
  fallbackRate,
  useGridMeter,
  today,
  fromDate,
  toDate,
}: {
  readings: EnergyReading[];
  dateScopedReadings: EnergyReading[];
  cycleOverrides: BillingCycleOverride[];
  billingCycleStartDay: number;
  fallbackRate: number;
  useGridMeter: boolean;
  today: string;
  fromDate?: string;
  toDate?: string;
}): BillCutoffItem[] {
  const sortedDateScopedReadings = sortReadingsAscending(dateScopedReadings);
  const firstReadingDate = sortedDateScopedReadings[0]?.date;
  const lastReadingDate = sortedDateScopedReadings.at(-1)?.date;

  if (!firstReadingDate || !lastReadingDate) {
    return [];
  }

  const items: BillCutoffItem[] = [];
  let window = getBillingCycleWindow({ today: firstReadingDate, billingCycleStartDay });

  while (window.startDate <= lastReadingDate && window.startDate <= today) {
    const override = cycleOverrides.find((cycleOverride) => cycleOverride.anchorCycleStartDate === window.startDate);
    const cycleStartDate = override?.cycleStartDate ?? window.startDate;
    const cycleEndDate = override?.cycleEndDate ?? window.endDate;

    const nextCycleStartDate = window.nextStartDate;

    if (cycleEndDate <= today && nextCycleStartDate <= today && isDateWithinRange(nextCycleStartDate, fromDate, toDate)) {
      const cycleReadings = readings.filter((reading) => isDateWithinRange(reading.date, cycleStartDate, cycleEndDate));

      if (cycleReadings.length > 0) {
        const estimate = calculateBillEstimate({
          readings: cycleReadings,
          fallbackRate,
          overrideRate: override?.importRate,
          useGridMeter,
        });

        items.push({
          type: 'bill-cutoff',
          id: `bill-cutoff-${window.startDate}`,
          sortDate: nextCycleStartDate,
          cycleStartDate,
          cycleEndDate,
          nextCycleStartDate,
          readingCount: cycleReadings.length,
          ...estimate,
        });
      }
    }

    if (window.nextStartDate <= window.startDate) {
      break;
    }

    window = getBillingCycleWindow({ today: window.nextStartDate, billingCycleStartDay });
  }

  return items;
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
  const cycleOverrides = useBillingCyclesStore((state) => state.cycleOverrides);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const { formatCurrency, formatRate } = useAppFormatters();
  const today = getTodayDateInputValue();
  const [query, setQuery] = useState('');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dateScopedReadings = useMemo(
    () => readings.filter((reading) => isDateWithinRange(reading.date, fromDate || undefined, toDate || undefined)),
    [fromDate, readings, toDate],
  );
  const billCutoffItems = useMemo(
    () =>
      metricFilter === 'solar' || metricFilter === 'export'
        ? []
        : buildBillCutoffItems({
            readings,
            dateScopedReadings,
            cycleOverrides,
            billingCycleStartDay: systemProfile?.billingCycleStartDay ?? 1,
            fallbackRate: systemProfile?.defaultImportRate ?? 0,
            useGridMeter: systemProfile?.gridInputMode === 'cumulative',
            today,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          }),
    [
      cycleOverrides,
      dateScopedReadings,
      fromDate,
      metricFilter,
      readings,
      systemProfile?.billingCycleStartDay,
      systemProfile?.defaultImportRate,
      systemProfile?.gridInputMode,
      toDate,
      today,
    ],
  );

  const filteredReadings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return dateScopedReadings.filter((reading) => {
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
  }, [dateScopedReadings, metricFilter, query]);

  const historyItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const readingItems: ReadingHistoryItem[] = filteredReadings.map((reading) => ({
      type: 'reading',
      id: reading.id,
      sortDate: reading.date,
      reading,
    }));
    const queryFilteredBillItems =
      normalizedQuery.length === 0
        ? billCutoffItems
        : billCutoffItems.filter((item) =>
            [
              'bill',
              'cutoff',
              'cycle',
              'summary',
              'estimate',
              item.cycleStartDate,
              item.cycleEndDate,
              item.nextCycleStartDate,
              String(item.estimatedCost),
              String(item.gridKwh),
              String(item.rate),
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery),
          );

    return [...readingItems, ...queryFilteredBillItems].sort((left, right) => {
      const dateSort = right.sortDate.localeCompare(left.sortDate);

      if (dateSort !== 0) {
        return dateSort;
      }

      if (left.type === right.type) {
        return left.id.localeCompare(right.id);
      }

      return left.type === 'bill-cutoff' ? -1 : 1;
    });
  }, [billCutoffItems, filteredReadings, query]);

  const sections = useMemo(() => buildSections(historyItems), [historyItems]);
  const dailySummaries = useMemo(() => aggregateReadingsByDate(filteredReadings).slice(-8), [filteredReadings]);
  const totalSavings = filteredReadings.reduce((sum, reading) => sum + reading.estimatedSavings, 0);
  const lineData = dailySummaries.length
    ? dailySummaries.map((summary) => ({ value: summary.estimatedSavings }))
    : [{ value: 0 }, { value: 0 }, { value: 0 }];
  const chartWidth = Math.min(width - 160, 210);
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
              <View style={{ pointerEvents: 'none', width: Math.max(145, chartWidth) }}>
                <LineChart
                  data={lineData}
                  width={Math.max(145, chartWidth)}
                  height={110}
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
        renderSectionHeader={({ section: { title, data } }) => {
          const readingCount = data.filter((item) => item.type === 'reading').length;

          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 4 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontFamily: fontFamilies.bodyHeavy }}>{title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                {readingCount} reading{readingCount === 1 ? '' : 's'}
              </Text>
            </View>
          );
        }}
        renderItem={({ item }) => {
          if (item.type === 'bill-cutoff') {
            return (
              <SoftCard
                tone="blue"
                padding={14}
                style={{ minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}
              >
                <View style={{ width: 48, gap: 2 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
                    {formatMonthDayLabel(item.nextCycleStartDate)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>
                    {formatWeekdayLabel(item.nextCycleStartDate)}
                  </Text>
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
                  <Ionicons name="receipt-outline" size={20} color={theme.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>Cycle summary</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>
                    {formatMonthDayLabel(item.cycleStartDate)} - {formatMonthDayLabel(item.cycleEndDate)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>
                    {formatEnergy(item.gridKwh)} grid | {formatRate(item.rate)}
                    {item.hasOverride ? ' bill rate' : ''} | {item.basis === 'meter' ? 'meter' : `${item.readingCount} readings`}
                  </Text>
                </View>
                <View style={{ width: 104, alignItems: 'flex-end', gap: 2 }}>
                  <Text
                    selectable
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={{ color: theme.accent, fontSize: 18, fontFamily: fontFamilies.bodyHeavy, fontVariant: ['tabular-nums'] }}
                  >
                    {formatCurrency(item.estimatedCost)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>estimated</Text>
                </View>
              </SoftCard>
            );
          }

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open reading from ${formatShortDate(item.reading.date)}`}
              onPress={() => router.push({ pathname: '/readings/[readingId]', params: { readingId: item.reading.id } })}
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
                  {formatMonthDayLabel(item.reading.date)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>{formatWeekdayLabel(item.reading.date)}</Text>
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
                  {formatCompactKwh(item.reading.solarGenerationKwh)}
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
                  {formatCompactKwh(item.reading.gridConsumptionKwh)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>kWh grid</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
            </Pressable>
          );
        }}
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
