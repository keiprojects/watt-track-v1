import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  AppButton,
  MotionSection,
  Panel,
  SectionTitle,
  type AppIconName,
  useScreenContentContainerStyle,
} from '@/components/app-ui';
import { CurrentWeatherCard } from '@/components/current-weather-card';
import { DashboardRangeDropdown } from '@/components/dashboard-range-dropdown';
import { HouseEnergyHero } from '@/components/house-energy-hero';
import { MetricCard } from '@/components/metric-card';
import { RoiProgressRing } from '@/components/roi-progress-ring';
import { WeeklyBarChart } from '@/components/weekly-bar-chart';
import {
  aggregateReadingsByDate,
  filterDashboardReadings,
  summarizeReadings,
  summarizeRoi,
  type DailyReadingSummary,
} from '@/services/calculation.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { DashboardPeriod } from '@/types/settings';
import {
  addDaysToDate,
  formatMonthDayLabel,
  formatMonthShortLabel,
  formatShortDate,
  formatWeekdayLabel,
  getMonthPrefix,
  getTodayDateInputValue,
} from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

const dashboardPeriodOptions: { label: string; value: DashboardPeriod }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
];

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

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

function getUsageTrendTitle(period: DashboardPeriod): string {
  if (period === 'year' || period === 'all') {
    return 'Monthly energy used';
  }

  if (period === '7d') {
    return 'Daily energy used';
  }

  return 'Logged days';
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
        label: formatMonthShortLabel(`${monthPrefix}-01`),
        value,
      }));
  }

  return summaries.slice(-10).map((summary) => ({
    label: formatMonthDayLabel(summary.date),
    value: summary.estimatedHomeUsageKwh,
  }));
}

type ReadingMiniMetricProps = {
  icon: AppIconName;
  label: string;
  value: string;
  color: string;
  showDivider?: boolean;
};

function ReadingMiniMetric({ icon, label, value, color, showDivider = false }: ReadingMiniMetricProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: 6,
        borderRightWidth: showDivider ? 1 : 0,
        borderRightColor: theme.border,
        paddingHorizontal: 6,
      }}
    >
      <View
        style={{
          height: 32,
          width: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          borderCurve: 'continuous',
          backgroundColor: theme.surfaceRaised,
        }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text numberOfLines={1} style={{ color: theme.textSubtle, fontSize: 10, fontFamily: fontFamilies.bodyStrong }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={{
          width: '100%',
          textAlign: 'center',
          color: theme.text,
          fontSize: 14,
          fontFamily: fontFamilies.bodyHeavy,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const settings = useSettingsStore((state) => state.settings);
  const { formatCurrency, formatKwh } = useAppFormatters();
  const contentContainerStyle = useScreenContentContainerStyle({ gap: 16 });
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>(settings.defaultDashboardPeriod);

  useEffect(() => {
    setDashboardPeriod(settings.defaultDashboardPeriod);
  }, [settings.defaultDashboardPeriod]);

  const today = getTodayDateInputValue();
  const periodReadings = useMemo(
    () => filterDashboardReadings({ readings, today, period: dashboardPeriod }),
    [dashboardPeriod, readings, today],
  );
  const periodDailySummaries = useMemo(() => aggregateReadingsByDate(periodReadings), [periodReadings]);
  const periodSummary = useMemo(() => summarizeReadings(periodReadings), [periodReadings]);
  const roiSummary = useMemo(
    () => summarizeRoi({ profile: systemProfile, readings, costs }),
    [costs, readings, systemProfile],
  );
  const chartBars = useMemo(
    () => buildChartBars({ summaries: periodDailySummaries, period: dashboardPeriod, today }),
    [dashboardPeriod, periodDailySummaries, today],
  );
  const chartHighlightIndex = Math.max(0, chartBars.length - 1);
  const chartHighlightLabel = formatKwh(chartBars[chartHighlightIndex]?.value ?? 0);
  const latestReading = readings[0];
  const periodLabel = getPeriodLabel(dashboardPeriod);
  const hasPeriodData = periodReadings.length > 0;
  const brandColor = theme.mode === 'dark' ? theme.accent : '#1769e8';
  const positiveAccent = theme.mode === 'dark' ? theme.accent : '#5b8f00';
  const gridAccent = theme.mode === 'dark' ? theme.secondaryChart : '#1769e8';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical
      overScrollMode="always"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={contentContainerStyle}
    >
      <MotionSection index={0} style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Text
            style={{
              color: brandColor,
              fontSize: 28,
              fontFamily: fontFamilies.display,
              letterSpacing: -0.8,
            }}
          >
            WattTrack
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/(tabs)/settings')}
            style={({ pressed }) => ({
              height: 44,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              opacity: pressed ? 0.76 : 1,
              boxShadow: theme.shadow,
            })}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.textMuted} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
          <View style={{ flex: 1, gap: 5, paddingTop: 3 }}>
            <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
              {getGreeting()},
            </Text>
            <Text
              selectable
              style={{
                color: theme.text,
                fontSize: 27,
                lineHeight: 32,
                fontFamily: fontFamilies.displayMedium,
              }}
            >
              {systemProfile?.systemName ?? 'Your residence'}
            </Text>
            <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
              Here&apos;s your energy snapshot.
            </Text>
          </View>
          <CurrentWeatherCard location={systemProfile?.location} variant="compact" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Ionicons name="location-outline" size={17} color={theme.textSubtle} />
            <Text
              numberOfLines={1}
              style={{ flex: 1, color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}
            >
              {systemProfile?.location ?? 'Location not set'}
            </Text>
          </View>
          <DashboardRangeDropdown
            options={dashboardPeriodOptions}
            value={dashboardPeriod}
            onChange={setDashboardPeriod}
          />
        </View>
      </MotionSection>

      <MotionSection index={1}>
        <Panel padding={12} style={{ gap: 14 }}>
          <HouseEnergyHero />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <MetricCard
              label="Solar generated"
              value={formatKwh(periodSummary.solarGeneratedKwh)}
              helper={periodLabel}
              tone="accent"
              icon="sunny-outline"
            />
            <MetricCard
              label="Grid usage"
              value={formatKwh(periodSummary.gridConsumedKwh)}
              helper={periodLabel}
              icon="business-outline"
            />
            <MetricCard
              label="Total energy used"
              value={formatKwh(periodSummary.homeUsageKwh)}
              helper={periodLabel}
              icon="flash-outline"
            />
            <MetricCard
              label="Estimated savings"
              value={formatCurrency(periodSummary.estimatedSavings)}
              helper={periodLabel}
              tone="accent"
              icon="wallet-outline"
            />
          </View>
        </Panel>
      </MotionSection>

      <MotionSection index={2}>
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ flex: 1, gap: 7 }}>
              <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
                ROI / Payback
              </Text>
              <Text
                selectable
                style={{
                  color: positiveAccent,
                  fontSize: 36,
                  fontFamily: fontFamilies.display,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`${roiSummary.roiPercentage.toFixed(1)}%`}
              </Text>
              <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
                {roiSummary.totalCapitalInvestment > 0
                  ? `${formatCurrency(roiSummary.remainingAmount)} remaining to recover`
                  : 'Add your system cost to begin payback tracking.'}
              </Text>
            </View>
            <RoiProgressRing progress={roiSummary.paybackProgress} />
          </View>
        </Panel>
      </MotionSection>

      {hasPeriodData ? (
        <MotionSection index={3}>
          <Panel padding={18} style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ minWidth: 0, flex: 1, gap: 4 }}>
                <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.displayMedium }}>
                  {getUsageTrendTitle(dashboardPeriod)}
                </Text>
                <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>
                  {`${periodDailySummaries.length} logged day${periodDailySummaries.length === 1 ? '' : 's'} · ${periodLabel}`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View detailed analytics"
                onPress={() => router.push('/(tabs)/insights')}
                style={({ pressed }) => ({
                  height: 38,
                  width: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  backgroundColor: theme.surfaceRaised,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Ionicons name="arrow-forward" size={19} color={theme.textMuted} />
              </Pressable>
            </View>

            <WeeklyBarChart
              data={chartBars}
              highlightIndex={chartHighlightIndex}
              valueLabel={chartHighlightLabel}
              unitLabel="kWh"
            />
          </Panel>
        </MotionSection>
      ) : (
        <MotionSection index={3}>
          <Panel tone="muted">
            <SectionTitle
              title={readings.length === 0 ? 'Start tracking your energy' : 'No readings in this range'}
              description={
                readings.length === 0
                  ? 'Add your first grid and solar reading to populate these cards, savings, trends, and ROI.'
                  : `No saved readings fall inside ${periodLabel.toLowerCase()}. Choose another range or add a new reading.`
              }
              icon="reader-outline"
            />
            <AppButton
              label={readings.length === 0 ? 'Add first reading' : 'Add a reading'}
              icon="add-circle-outline"
              onPress={() => router.push('/(tabs)/add')}
            />
          </Panel>
        </MotionSection>
      )}

      {latestReading ? (
        <MotionSection index={4}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open reading history"
            onPress={() => router.push('/(tabs)/history')}
            style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.992 : 1 }] })}
          >
            <Panel padding={18} style={{ gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.displayMedium }}>
                    Latest reading
                  </Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 13, fontFamily: fontFamilies.body }}>
                    {formatShortDate(latestReading.date)}
                    {latestReading.time ? ` · ${latestReading.time}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={theme.textSubtle} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                <ReadingMiniMetric
                  icon="business-outline"
                  label="Grid"
                  value={formatKwh(latestReading.gridConsumptionKwh)}
                  color={gridAccent}
                  showDivider
                />
                <ReadingMiniMetric
                  icon="sunny-outline"
                  label="Solar"
                  value={formatKwh(latestReading.solarGenerationKwh)}
                  color={positiveAccent}
                  showDivider
                />
                <ReadingMiniMetric
                  icon="flash-outline"
                  label="Total used"
                  value={formatKwh(latestReading.estimatedHomeUsageKwh)}
                  color={gridAccent}
                  showDivider
                />
                <ReadingMiniMetric
                  icon="wallet-outline"
                  label="Savings"
                  value={formatCurrency(latestReading.estimatedSavings)}
                  color={positiveAccent}
                />
              </View>
            </Panel>
          </Pressable>
        </MotionSection>
      ) : null}

      <MotionSection index={5}>
        <AppButton
          label="Add reading"
          icon="add"
          onPress={() => router.push('/(tabs)/add')}
          style={{ minHeight: 58 }}
        />
      </MotionSection>
    </ScrollView>
  );
}
