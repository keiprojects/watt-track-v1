import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  AppButton,
  MotionSection,
  Panel,
  SectionTitle,
  useScreenContentContainerStyle,
} from '@/components/app-ui';
import { MetricCard } from '@/components/metric-card';
import { PowerOrb } from '@/components/power-orb';
import { SegmentedControl } from '@/components/segmented-control';
import { WeeklyBarChart } from '@/components/weekly-bar-chart';
import {
  aggregateReadingsByDate,
  filterDashboardReadings,
  summarizeReadings,
  type DailyReadingSummary,
} from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { EnergyReading } from '@/types/reading';
import type { DashboardPeriod } from '@/types/settings';
import {
  addDaysToDate,
  differenceInCalendarDays,
  formatMonthLabel,
  formatShortDate,
  getMonthPrefix,
  getTodayDateInputValue,
  getYearPrefix,
} from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

const dashboardPeriodOptions: { label: string; value: DashboardPeriod; icon: 'calendar-outline' | 'pulse-outline' }[] = [
  { label: '7d', value: '7d', icon: 'pulse-outline' },
  { label: '30d', value: '30d', icon: 'pulse-outline' },
  { label: 'Month', value: 'month', icon: 'calendar-outline' },
  { label: 'Year', value: 'year', icon: 'calendar-outline' },
  { label: 'All', value: 'all', icon: 'calendar-outline' },
];

function getPeriodLabel(period: DashboardPeriod): string {
  if (period === '7d') {
    return 'Last 7 days';
  }

  if (period === '30d') {
    return 'Last 30 days';
  }

  if (period === 'month') {
    return 'This month';
  }

  if (period === 'year') {
    return 'This year';
  }

  return 'All time';
}

function getPeriodSummaryTitle(period: DashboardPeriod): string {
  if (period === '7d') {
    return 'Seven-day summary';
  }

  if (period === '30d') {
    return 'Thirty-day summary';
  }

  if (period === 'month') {
    return 'Monthly summary';
  }

  if (period === 'year') {
    return 'Yearly summary';
  }

  return 'Lifetime summary';
}

function getUsageTrendTitle(period: DashboardPeriod): string {
  if (period === 'year' || period === 'all') {
    return 'Usage by month';
  }

  if (period === '7d') {
    return 'Usage by day';
  }

  return 'Recent logged days';
}

function getUsageChangeLabel(currentValue: number, previousValue: number): string {
  if (previousValue === 0 && currentValue === 0) {
    return 'No change vs previous logged day';
  }

  if (previousValue === 0) {
    return 'First tracked day';
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const direction = delta >= 0 ? 'up' : 'down';
  return `${direction} ${Math.abs(delta).toFixed(1)}% vs previous logged day`;
}

function formatWeekdayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00`));
}

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00`));
}

function formatMonthShortLabel(monthPrefix: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${monthPrefix}-01T00:00:00`));
}

function buildChartBars({
  summaries,
  period,
  today,
}: {
  summaries: DailyReadingSummary[];
  period: DashboardPeriod;
  today: string;
}) {
  if (period === '7d') {
    const summariesByDate = new Map(summaries.map((summary) => [summary.date, summary]));

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDaysToDate(today, index - 6);
      return {
        label: formatWeekdayLabel(date),
        value: summariesByDate.get(date)?.estimatedHomeUsageKwh ?? 0,
      };
    });
  }

  if (period === 'year' || period === 'all') {
    const monthlyUsage = summaries.reduce<Map<string, number>>((grouped, summary) => {
      const monthPrefix = getMonthPrefix(summary.date);
      grouped.set(monthPrefix, (grouped.get(monthPrefix) ?? 0) + summary.estimatedHomeUsageKwh);
      return grouped;
    }, new Map());

    return [...monthlyUsage.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .slice(-6)
      .map(([monthPrefix, value]) => ({
        label: formatMonthShortLabel(monthPrefix),
        value,
      }));
  }

  return summaries.slice(-10).map((summary) => ({
    label: formatDayLabel(summary.date),
    value: summary.estimatedHomeUsageKwh,
  }));
}

function getComparisonWindow({
  readings,
  today,
  period,
}: {
  readings: EnergyReading[];
  today: string;
  period: DashboardPeriod;
}): { label: string; readings: EnergyReading[] } | null {
  if (period === 'all') {
    return null;
  }

  if (period === 'month') {
    const currentMonthStart = `${getMonthPrefix(today)}-01`;
    const previousMonthDate = addDaysToDate(currentMonthStart, -1);
    const previousMonthPrefix = getMonthPrefix(previousMonthDate);

    return {
      label: formatMonthLabel(previousMonthDate),
      readings: readings.filter((reading) => reading.date.startsWith(previousMonthPrefix)),
    };
  }

  if (period === 'year') {
    const previousYear = String(Number(getYearPrefix(today)) - 1).padStart(4, '0');

    return {
      label: previousYear,
      readings: readings.filter((reading) => reading.date.startsWith(previousYear)),
    };
  }

  const rangeDays = period === '7d' ? 7 : 30;

  return {
    label: `previous ${rangeDays} days`,
    readings: readings.filter((reading) => {
      const distance = differenceInCalendarDays(today, reading.date);
      return distance >= rangeDays && distance < rangeDays * 2;
    }),
  };
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const settings = useSettingsStore((state) => state.settings);
  const { formatCurrency, formatKwh } = useAppFormatters();
  const contentContainerStyle = useScreenContentContainerStyle();

  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>(settings.defaultDashboardPeriod);

  useEffect(() => {
    setDashboardPeriod(settings.defaultDashboardPeriod);
  }, [settings.defaultDashboardPeriod]);

  const today = getTodayDateInputValue();
  const dailyReadings = useMemo(() => aggregateReadingsByDate(readings), [readings]);
  const todayReading = useMemo(() => dailyReadings.find((reading) => reading.date === today), [dailyReadings, today]);
  const previousLoggedDay = useMemo(
    () => dailyReadings.filter((reading) => reading.date < today).at(-1),
    [dailyReadings, today],
  );
  const periodReadings = useMemo(
    () => filterDashboardReadings({ readings, today, period: dashboardPeriod }),
    [dashboardPeriod, readings, today],
  );
  const periodDailySummaries = useMemo(() => aggregateReadingsByDate(periodReadings), [periodReadings]);
  const periodSummary = useMemo(() => summarizeReadings(periodReadings), [periodReadings]);
  const comparisonWindow = useMemo(
    () => getComparisonWindow({ readings, today, period: dashboardPeriod }),
    [dashboardPeriod, readings, today],
  );
  const comparisonSummary = useMemo(
    () => summarizeReadings(comparisonWindow?.readings ?? []),
    [comparisonWindow?.readings],
  );
  const chartBars = useMemo(
    () => buildChartBars({ summaries: periodDailySummaries, period: dashboardPeriod, today }),
    [dashboardPeriod, periodDailySummaries, today],
  );
  const comparisonLabel = comparisonWindow?.label;
  const periodDescription = comparisonLabel
    ? `${periodDailySummaries.length} logged day(s), compared with ${comparisonLabel}.`
    : `${periodDailySummaries.length} logged day(s) in your saved history.`;
  const solarDelta = periodSummary.solarGeneratedKwh - comparisonSummary.solarGeneratedKwh;
  const usageDelta = periodSummary.homeUsageKwh - comparisonSummary.homeUsageKwh;
  const savingsDelta = periodSummary.estimatedSavings - comparisonSummary.estimatedSavings;
  const rangeHasData = periodReadings.length > 0;
  const chartHighlightIndex = Math.max(0, chartBars.length - 1);
  const chartHighlightLabel = formatKwh(chartBars[chartHighlightIndex]?.value ?? 0);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={contentContainerStyle}
    >
      <MotionSection index={0}>
        <Panel tone="inverse" style={{ backgroundColor: theme.header, gap: 20 }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -48,
              right: -20,
              height: 180,
              width: 180,
              borderRadius: 999,
              backgroundColor: theme.accentGlow,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: -70,
              left: -30,
              height: 160,
              width: 160,
              borderRadius: 999,
              backgroundColor: 'rgba(104, 162, 255, 0.12)',
            }}
          />

          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: theme.accent,
                fontSize: 11,
                fontFamily: fontFamilies.bodyStrong,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Energy workspace
            </Text>
            <Text
              style={{
                color: theme.textOnDark,
                fontSize: 31,
                fontFamily: fontFamilies.display,
              }}
            >
              {systemProfile?.systemName ?? 'WattTrack'}
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 14,
                fontFamily: fontFamilies.body,
              }}
            >
              {systemProfile?.location ? `${systemProfile.location} | ` : ''}
              {formatMonthLabel(today)}
            </Text>
          </View>

          {readings.length === 0 ? (
            <View style={{ gap: 14 }}>
              <Text style={{ color: theme.textOnDark, fontSize: 21, fontFamily: fontFamilies.displayMedium }}>
                Start your first energy snapshot.
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20, fontFamily: fontFamilies.body }}>
                Add one reading to unlock the daily view, trend tracking, and payback analytics.
              </Text>
              <AppButton label="Add first reading" icon="add-circle-outline" onPress={() => router.push('/(tabs)/add')} fullWidth={false} />
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                <View style={{ flex: 1, gap: 10 }}>
                  <Text
                    style={{
                      color: theme.accent,
                      fontSize: 11,
                      fontFamily: fontFamilies.bodyStrong,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    Today&apos;s solar
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: theme.textOnDark,
                      fontSize: 46,
                      fontFamily: fontFamilies.display,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatKwh(todayReading?.solarGenerationKwh ?? 0)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: fontFamilies.body }}>
                    {todayReading ? `Logged on ${formatShortDate(todayReading.date)}` : 'No reading saved today'}
                  </Text>
                </View>
                <PowerOrb size={116} />
              </View>

              <View
                style={{
                  gap: 12,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.08)',
                  paddingTop: 16,
                }}
              >
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 12,
                    fontFamily: fontFamilies.bodyStrong,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  Range
                </Text>
                <SegmentedControl options={dashboardPeriodOptions} value={dashboardPeriod} onChange={setDashboardPeriod} />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View
                  style={{
                    flex: 1,
                    gap: 8,
                    borderRadius: 22,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    padding: 16,
                  }}
                >
                  <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                    Today&apos;s usage
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: theme.textOnDark,
                      fontSize: 24,
                      fontFamily: fontFamilies.bodyHeavy,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatKwh(todayReading?.estimatedHomeUsageKwh ?? 0)}
                  </Text>
                  <Text style={{ color: theme.accent, fontSize: 12, fontFamily: fontFamilies.body }}>
                    {previousLoggedDay
                      ? getUsageChangeLabel(
                          todayReading?.estimatedHomeUsageKwh ?? 0,
                          previousLoggedDay.estimatedHomeUsageKwh,
                        )
                      : 'First tracked day'}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    gap: 8,
                    borderRadius: 22,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    padding: 16,
                  }}
                >
                  <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                    Estimated bill
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: theme.textOnDark,
                      fontSize: 24,
                      fontFamily: fontFamilies.bodyHeavy,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatCurrency(todayReading?.estimatedGridCost ?? 0)}
                  </Text>
                  <Text style={{ color: theme.accent, fontSize: 12, fontFamily: fontFamilies.body }}>
                    {periodSummary.estimatedGridCost > 0
                      ? `${formatCurrency(periodSummary.estimatedGridCost)} in ${getPeriodLabel(dashboardPeriod).toLowerCase()}`
                      : 'Estimated from your saved rates'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Panel>
      </MotionSection>

      {readings.length > 0 ? (
        rangeHasData ? (
          <>
            <MotionSection index={1} style={{ gap: 14 }}>
              <SectionTitle
                title={getPeriodSummaryTitle(dashboardPeriod)}
                description={periodDescription}
                icon="stats-chart-outline"
                eyebrow="At a glance"
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <MetricCard
                  label="Solar generated"
                  value={formatKwh(periodSummary.solarGeneratedKwh)}
                  helper={
                    comparisonLabel
                      ? `${solarDelta >= 0 ? '+' : '-'}${formatKwh(Math.abs(solarDelta))} vs ${comparisonLabel}`
                      : 'Estimated from logged readings'
                  }
                  tone="accent"
                  icon="sunny-outline"
                />
                <MetricCard
                  label="Home usage"
                  value={formatKwh(periodSummary.homeUsageKwh)}
                  helper={
                    comparisonLabel
                      ? `${usageDelta >= 0 ? '+' : '-'}${formatKwh(Math.abs(usageDelta))} vs ${comparisonLabel}`
                      : 'Solar self-use plus grid consumption'
                  }
                  icon="flash-outline"
                />
                <MetricCard
                  label="Estimated savings"
                  value={formatCurrency(periodSummary.estimatedSavings)}
                  helper={
                    comparisonLabel
                      ? `${savingsDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(savingsDelta))} vs ${comparisonLabel}`
                      : 'Estimated from your saved rates'
                  }
                  tone="warning"
                  icon="wallet-outline"
                />
              </View>
            </MotionSection>

            <MotionSection index={2}>
              <Panel>
                <SectionTitle
                  title={getUsageTrendTitle(dashboardPeriod)}
                  description="Recent logged movement, simplified into one stronger analytics surface."
                  icon="pulse-outline"
                  eyebrow="Trend"
                />
                <WeeklyBarChart
                  data={chartBars}
                  title={getUsageTrendTitle(dashboardPeriod)}
                  highlightIndex={chartHighlightIndex}
                  valueLabel={chartHighlightLabel}
                />
                <AppButton
                  label="View detailed analytics"
                  icon="arrow-forward-outline"
                  onPress={() => router.push('/(tabs)/insights')}
                  fullWidth={false}
                />
              </Panel>
            </MotionSection>
          </>
        ) : (
          <MotionSection index={1}>
            <Panel>
              <SectionTitle
                title="No readings in this range"
                description={`You have saved readings, but none fall inside ${getPeriodLabel(dashboardPeriod).toLowerCase()}. Change the range or add a new reading.`}
                icon="hourglass-outline"
              />
              <AppButton label="Add a reading" icon="add-circle-outline" onPress={() => router.push('/(tabs)/add')} fullWidth={false} />
            </Panel>
          </MotionSection>
        )
      ) : null}
    </ScrollView>
  );
}
