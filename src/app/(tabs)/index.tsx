import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, MotionSection, Panel, SectionTitle, type AppIconName } from '@/components/app-ui';
import { CurrentWeatherCard } from '@/components/current-weather-card';
import { DashboardRangeDropdown } from '@/components/dashboard-range-dropdown';
import { HouseEnergyHero } from '@/components/house-energy-hero';
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

type FlowMetricProps = {
  icon: AppIconName;
  label: string;
  value: string;
  helper: string;
  color: string;
  align?: 'left' | 'right';
};

function FlowMetric({ icon, label, value, helper, color, align = 'left' }: FlowMetricProps) {
  const theme = useAppTheme();
  const alignRight = align === 'right';

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: alignRight ? 'flex-end' : 'flex-start',
        gap: 7,
        paddingHorizontal: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Ionicons name={icon} size={19} color={color} />
        <Text
          numberOfLines={2}
          style={{
            maxWidth: 92,
            color: theme.textMuted,
            fontSize: 12,
            lineHeight: 16,
            textAlign: alignRight ? 'right' : 'left',
            fontFamily: fontFamilies.bodyStrong,
          }}
        >
          {label}
        </Text>
      </View>

      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
        style={{
          width: '100%',
          color: theme.text,
          fontSize: 22,
          lineHeight: 28,
          textAlign: alignRight ? 'right' : 'left',
          fontFamily: fontFamilies.bodyHeavy,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          color,
          fontSize: 11,
          textAlign: alignRight ? 'right' : 'left',
          fontFamily: fontFamilies.bodyStrong,
        }}
      >
        {helper}
      </Text>
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
  const primaryAccent = theme.accent;
  const secondaryAccent = theme.textMuted;
  const subtleAccent = theme.textSubtle;
  const greetingName = getGreetingName(systemProfile?.systemName);
  const roiLabel = `${roiSummary.roiPercentage.toFixed(1)}%`;
  const dividerColor = theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(9, 9, 11, 0.14)';

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
        paddingBottom: 34 + insets.bottom,
      }}
    >
      <MotionSection index={0} style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Text
            style={{
              color: theme.text,
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
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
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

      <MotionSection index={1} style={{ gap: 4 }}>
        <HouseEnergyHero />

        <View
          style={{
            position: 'relative',
            height: 286,
            paddingHorizontal: 0,
            paddingVertical: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', minHeight: 88 }}>
            <FlowMetric
              icon="sunny-outline"
              label="Solar generated"
              value={formatKwh(periodSummary.solarGeneratedKwh)}
              helper={periodLabel}
              color={primaryAccent}
            />
            <View style={{ width: 104 }} />
            <FlowMetric
              icon="business-outline"
              label="Grid usage"
              value={formatKwh(periodSummary.gridConsumedKwh)}
              helper={periodLabel}
              color={secondaryAccent}
              align="right"
            />
          </View>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 96,
              left: 18,
              right: 18,
              height: 1.5,
              backgroundColor: dividerColor,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 72,
              left: '50%',
              bottom: 72,
              width: 1.5,
              backgroundColor: dividerColor,
            }}
          />

          <View
            style={{
              position: 'absolute',
              top: 82,
              left: '50%',
              height: 118,
              width: 118,
              marginLeft: -59,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: primaryAccent,
              backgroundColor: theme.background,
            }}
          >
            <View
              style={{
                height: 27,
                width: 27,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                backgroundColor: theme.surfaceRaised,
              }}
            >
              <Ionicons name="flash-outline" size={16} color={primaryAccent} />
            </View>
            <Text
              style={{
                maxWidth: 92,
                color: theme.textMuted,
                fontSize: 10,
                lineHeight: 12,
                textAlign: 'center',
                fontFamily: fontFamilies.bodyStrong,
              }}
            >
              Total energy used
            </Text>
            <Text
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.62}
              style={{
                width: 96,
                color: theme.text,
                fontSize: 16,
                textAlign: 'center',
                fontFamily: fontFamilies.bodyHeavy,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatKwh(periodSummary.homeUsageKwh)}
            </Text>
            <Text style={{ color: theme.textSubtle, fontSize: 9, fontFamily: fontFamilies.body }}>{periodLabel}</Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', minHeight: 88 }}>
            <FlowMetric
              icon="wallet-outline"
              label="Estimated savings"
              value={formatCurrency(periodSummary.estimatedSavings)}
              helper={periodLabel}
              color={secondaryAccent}
            />
            <View style={{ width: 104 }} />
            <FlowMetric
              icon="trending-up-outline"
              label="ROI / Payback"
              value={roiLabel}
              helper={
                roiSummary.totalCapitalInvestment > 0
                  ? `${formatCurrency(roiSummary.remainingAmount)} left`
                  : 'Add system cost'
              }
              color={subtleAccent}
              align="right"
            />
          </View>
        </View>
      </MotionSection>

      {hasPeriodData ? (
        <MotionSection index={2}>
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
        <MotionSection index={2}>
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
        <MotionSection index={3}>
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
                  color={secondaryAccent}
                  showDivider
                />
                <ReadingMiniMetric
                  icon="sunny-outline"
                  label="Solar"
                  value={formatKwh(latestReading.solarGenerationKwh)}
                  color={primaryAccent}
                  showDivider
                />
                <ReadingMiniMetric
                  icon="flash-outline"
                  label="Total used"
                  value={formatKwh(latestReading.estimatedHomeUsageKwh)}
                  color={secondaryAccent}
                  showDivider
                />
                <ReadingMiniMetric
                  icon="wallet-outline"
                  label="Savings"
                  value={formatCurrency(latestReading.estimatedSavings)}
                  color={primaryAccent}
                />
              </View>
            </Panel>
          </Pressable>
        </MotionSection>
      ) : null}

      <MotionSection index={4}>
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
