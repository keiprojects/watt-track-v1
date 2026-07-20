import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, MotionSection, Panel, SectionTitle, type AppIconName } from '@/components/app-ui';
import { CurrentWeatherCard } from '@/components/current-weather-card';
import { DashboardRangeDropdown } from '@/components/dashboard-range-dropdown';
import { HouseEnergyHero } from '@/components/house-energy-hero';
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

function getGreetingName(systemName?: string): string {
  const compactName = systemName?.replace(/\s+(residence|home)$/i, '').trim();
  return compactName || 'there';
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
  if (period === '30d') {
    return 'Logged days (last 30 days)';
  }

  if (period === '7d') {
    return 'Logged days (last 7 days)';
  }

  if (period === 'month') {
    return 'Logged days (this month)';
  }

  if (period === 'year') {
    return 'Energy used by month';
  }

  return 'Energy history';
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
      .slice(-8)
      .map(([monthPrefix, value]) => ({
        label: formatMonthShortLabel(`${monthPrefix}-01`),
        value,
      }));
  }

  return summaries.slice(-30).map((summary) => ({
    label: formatMonthDayLabel(summary.date),
    value: summary.estimatedHomeUsageKwh,
  }));
}

type EnergyMetricCellProps = {
  icon: AppIconName;
  label: string;
  value: string;
  helper: string;
  color: string;
  rightBorder?: boolean;
  bottomBorder?: boolean;
};

function EnergyMetricCell({
  icon,
  label,
  value,
  helper,
  color,
  rightBorder = false,
  bottomBorder = false,
}: EnergyMetricCellProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        width: '50%',
        minHeight: 118,
        justifyContent: 'space-between',
        gap: 10,
        borderRightWidth: rightBorder ? 1 : 0,
        borderBottomWidth: bottomBorder ? 1 : 0,
        borderColor: theme.border,
        paddingHorizontal: 16,
        paddingVertical: 15,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            height: 32,
            width: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: `${color}18`,
          }}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text
          numberOfLines={2}
          style={{ flex: 1, color: theme.textMuted, fontSize: 12, lineHeight: 16, fontFamily: fontFamilies.bodyStrong }}
        >
          {label}
        </Text>
      </View>

      <View style={{ gap: 4 }}>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{
            color,
            fontSize: 24,
            lineHeight: 30,
            fontFamily: fontFamilies.bodyHeavy,
            fontVariant: ['tabular-nums'],
          }}
        >
          {value}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 11, fontFamily: fontFamilies.body }}>{helper}</Text>
      </View>
    </View>
  );
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
        paddingHorizontal: 5,
      }}
    >
      <Ionicons name={icon} size={17} color={color} />
      <Text numberOfLines={1} style={{ color: theme.textSubtle, fontSize: 10, fontFamily: fontFamilies.bodyStrong }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.66}
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
  const insets = useSafeAreaInsets();
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const settings = useSettingsStore((state) => state.settings);
  const { formatCurrency, formatKwh } = useAppFormatters();
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
  const positiveAccent = theme.primaryChart;
  const gridAccent = theme.secondaryChart;
  const greetingName = getGreetingName(systemProfile?.systemName);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical
      overScrollMode="always"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        gap: 16,
        paddingHorizontal: 18,
        paddingTop: Math.max(insets.top + 12, 24),
        paddingBottom: 112 + insets.bottom,
      }}
    >
      <MotionSection index={0} style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Text
            style={{
              color: theme.accent,
              fontSize: 29,
              fontFamily: fontFamilies.display,
              letterSpacing: -1,
            }}
          >
            WattTrack
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/(tabs)/settings')}
            style={({ pressed }) => ({
              height: 42,
              width: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 15,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              opacity: pressed ? 0.76 : 1,
              boxShadow: theme.shadow,
            })}
          >
            <Ionicons name="notifications-outline" size={21} color={theme.textMuted} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{
                color: theme.text,
                fontSize: 22,
                lineHeight: 28,
                fontFamily: fontFamilies.displayMedium,
              }}
            >
              {`${getGreeting()}, ${greetingName} 👋`}
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
          <DashboardRangeDropdown options={dashboardPeriodOptions} value={dashboardPeriod} onChange={setDashboardPeriod} />
        </View>
      </MotionSection>

      <MotionSection index={1}>
        <View
          style={{
            overflow: 'hidden',
            borderRadius: 28,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            boxShadow: theme.shadow,
          }}
        >
          <HouseEnergyHero />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <EnergyMetricCell
              icon="sunny-outline"
              label="Solar generated"
              value={formatKwh(periodSummary.solarGeneratedKwh)}
              helper={periodLabel}
              color={positiveAccent}
              rightBorder
              bottomBorder
            />
            <EnergyMetricCell
              icon="business-outline"
              label="Grid usage"
              value={formatKwh(periodSummary.gridConsumedKwh)}
              helper={periodLabel}
              color={gridAccent}
              bottomBorder
            />
            <EnergyMetricCell
              icon="flash-outline"
              label="Total energy used"
              value={formatKwh(periodSummary.homeUsageKwh)}
              helper={periodLabel}
              color={theme.text}
              rightBorder
            />
            <EnergyMetricCell
              icon="wallet-outline"
              label="Estimated savings"
              value={formatCurrency(periodSummary.estimatedSavings)}
              helper={periodLabel}
              color={positiveAccent}
            />
          </View>
        </View>
      </MotionSection>

      <MotionSection index={2}>
        <Panel padding={16} style={{ gap: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>ROI / Payback</Text>
              <Text
                selectable
                style={{
                  color: positiveAccent,
                  fontSize: 31,
                  lineHeight: 37,
                  fontFamily: fontFamilies.display,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`${roiSummary.roiPercentage.toFixed(1)}%`}
              </Text>
              <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>
                {roiSummary.totalCapitalInvestment > 0
                  ? `${formatCurrency(roiSummary.remainingAmount)} remaining to recover`
                  : 'Add your system cost to begin payback tracking.'}
              </Text>
            </View>
            <RoiProgressRing progress={roiSummary.paybackProgress} size={86} />
          </View>
        </Panel>
      </MotionSection>

      {hasPeriodData ? (
        <MotionSection index={3}>
          <Panel padding={18} style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ minWidth: 0, flex: 1, gap: 4 }}>
                <Text style={{ color: theme.text, fontSize: 19, fontFamily: fontFamilies.displayMedium }}>
                  {getUsageTrendTitle(dashboardPeriod)}
                </Text>
                <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>
                  {`${periodDailySummaries.length} logged day${periodDailySummaries.length === 1 ? '' : 's'}`}
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
                  ? 'Add your first grid and solar reading to populate savings, trends, and ROI.'
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
            <Panel padding={18} style={{ gap: 17 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 19, fontFamily: fontFamilies.displayMedium }}>Latest reading</Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.body }}>
                    {formatShortDate(latestReading.date)}
                    {latestReading.time ? ` · ${latestReading.time}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={21} color={theme.textSubtle} />
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
          style={{ minHeight: 56 }}
        />
      </MotionSection>
    </ScrollView>
  );
}
