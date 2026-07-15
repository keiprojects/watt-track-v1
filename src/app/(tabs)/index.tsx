import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  AppButton,
  MotionSection,
  OverlaySheet,
  Panel,
  SectionTitle,
} from '@/components/app-ui';
import { PowerOrb } from '@/components/power-orb';
import { SegmentedControl } from '@/components/segmented-control';
import { WeeklyBarChart } from '@/components/weekly-bar-chart';
import {
  aggregateReadingsByDate,
  buildDailyEnergySeries,
  summarizeReadings,
} from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { DashboardPeriod } from '@/types/settings';
import { formatMonthLabel, formatShortDate, getTodayDateInputValue } from '@/utils/date';
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

function getMonthComparison(currentValue: number, previousValue: number): string {
  if (previousValue === 0 && currentValue === 0) {
    return 'No month-over-month change yet';
  }

  if (previousValue === 0) {
    return 'First tracked month';
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const direction = delta >= 0 ? 'up' : 'down';
  return `${direction} ${Math.abs(delta).toFixed(1)}% vs last month`;
}

function formatWeekdayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00`));
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const settings = useSettingsStore((state) => state.settings);
  const { formatCurrency, formatKwh } = useAppFormatters();

  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>(settings.defaultDashboardPeriod);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setDashboardPeriod(settings.defaultDashboardPeriod);
  }, [settings.defaultDashboardPeriod]);

  const today = getTodayDateInputValue();
  const dailyReadings = useMemo(() => aggregateReadingsByDate(readings), [readings]);
  const todayReading = useMemo(() => dailyReadings.find((reading) => reading.date === today), [dailyReadings, today]);
  const chartData = useMemo(() => buildDailyEnergySeries({ readings, endDate: today, days: 7 }), [readings, today]);
  const monthReadings = useMemo(
    () => readings.filter((reading) => reading.date.startsWith(today.slice(0, 7))),
    [readings, today],
  );
  const monthSummary = useMemo(() => summarizeReadings(monthReadings), [monthReadings]);
  const yesterdayReading = useMemo(() => dailyReadings.at(-2), [dailyReadings]);
  const chartBars = useMemo(
    () =>
      chartData.map((item) => ({
        label: formatWeekdayLabel(item.date),
        value: item.solarGenerationKwh + item.gridConsumptionKwh,
      })),
    [chartData],
  );

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
      >
        <MotionSection index={0}>
          <Panel tone="inverse" style={{ backgroundColor: theme.header }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: theme.textOnDark, fontSize: 28, fontWeight: '800' }}>
                  {systemProfile?.systemName ?? 'WattTrack'}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                  {systemProfile?.location ? `${systemProfile.location} | ` : ''}
                  {formatMonthLabel(today)}
                </Text>
              </View>
              <AppButton label="Guide" icon="sparkles-outline" onPress={() => setShowGuide(true)} tone="ghost" fullWidth={false} />
            </View>

            {readings.length === 0 ? (
              <View style={{ gap: 14 }}>
                <Text style={{ color: theme.textOnDark, fontSize: 18, fontWeight: '700' }}>
                  Start your first energy snapshot.
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
                  Add one reading to unlock the live-style dashboard, charts, and payback tracking.
                </Text>
                <AppButton label="Add first reading" icon="add-circle-outline" onPress={() => router.push('/(tabs)/add')} />
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                  <View style={{ flex: 1, gap: 10 }}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>
                      TODAY'S SOLAR
                    </Text>
                    <Text
                      selectable
                      style={{
                        color: theme.textOnDark,
                        fontSize: 40,
                        fontWeight: '900',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatKwh(todayReading?.solarGenerationKwh ?? 0)}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                      {todayReading ? `Logged on ${formatShortDate(todayReading.date)}` : 'No reading saved today'}
                    </Text>
                  </View>
                  <PowerOrb />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      gap: 8,
                      borderRadius: 22,
                      borderCurve: 'continuous',
                      backgroundColor: theme.surface,
                      padding: 16,
                    }}
                  >
                    <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '800' }}>Today&apos;s Usage</Text>
                    <Text selectable style={{ color: theme.textOnDark, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                      {formatKwh(todayReading?.estimatedHomeUsageKwh ?? 0)}
                    </Text>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                      {yesterdayReading ? getMonthComparison(todayReading?.estimatedHomeUsageKwh ?? 0, yesterdayReading.estimatedHomeUsageKwh) : 'First tracked day'}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      gap: 8,
                      borderRadius: 22,
                      borderCurve: 'continuous',
                      backgroundColor: theme.surface,
                      padding: 16,
                    }}
                  >
                    <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '800' }}>Estimated Bill</Text>
                    <Text selectable style={{ color: theme.textOnDark, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                      {formatCurrency(todayReading?.estimatedGridCost ?? 0)}
                    </Text>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                      {monthSummary.estimatedGridCost > 0 ? `${formatCurrency(monthSummary.estimatedGridCost)} this month` : 'Estimated from your rates'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Panel>
        </MotionSection>

        {readings.length > 0 ? (
          <>
            <MotionSection index={1}>
              <Panel tone="muted" padding={18}>
                <SectionTitle
                  title="Dashboard view"
                  description={getPeriodLabel(dashboardPeriod)}
                  icon="options-outline"
                />
                <SegmentedControl options={dashboardPeriodOptions} value={dashboardPeriod} onChange={setDashboardPeriod} />
              </Panel>
            </MotionSection>

            <MotionSection index={2}>
              <Panel>
                <WeeklyBarChart
                  data={chartBars}
                  highlightIndex={Math.max(0, chartBars.length - 4)}
                  valueLabel={formatKwh(chartBars[Math.max(0, chartBars.length - 4)]?.value ?? 0)}
                />
                <AppButton label="View detailed analytics" icon="arrow-forward-outline" onPress={() => router.push('/(tabs)/insights')} />
              </Panel>
            </MotionSection>
          </>
        ) : null}
      </ScrollView>

      <OverlaySheet
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        title="How this layout works"
        description="The new home screen follows the dark energy-console style from your reference, but keeps the numbers grounded in your real data."
        variant="dialog"
        footer={<AppButton label="Close guide" onPress={() => setShowGuide(false)} icon="close-outline" />}
      >
        <Panel tone="muted" padding={16}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Hero card</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
            It surfaces one dominant number instead of four equal-weight cards competing for attention.
          </Text>
        </Panel>
        <Panel tone="muted" padding={16}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Charts first</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
            Recent solar and grid movement now sits in a stronger visual block, so trend reading is faster.
          </Text>
        </Panel>
        <Panel tone="muted" padding={16}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Icon-led scanning</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
            Each metric now carries a dedicated icon and contrast treatment to match the energy app aesthetic.
          </Text>
        </Panel>
      </OverlaySheet>
    </>
  );
}
