import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { EnergyChart } from '@/components/energy-chart';
import { MetricCard } from '@/components/metric-card';
import { SegmentedControl } from '@/components/segmented-control';
import {
  aggregateReadingsByDate,
  buildDailyEnergySeries,
  calculateSolarContribution,
  estimatePaybackForecast,
  filterDashboardReadings,
  summarizeReadings,
  summarizeRoi,
} from '@/services/calculation.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { DashboardPeriod } from '@/types/settings';
import { addDaysToDate, formatMonthLabel, formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

const dashboardPeriodOptions: { label: string; value: DashboardPeriod }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'All', value: 'all' },
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
    return 'First month with tracked data';
  }

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  const direction = delta >= 0 ? 'up' : 'down';
  return `${direction} ${Math.abs(delta).toFixed(1)}% vs last month`;
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const settings = useSettingsStore((state) => state.settings);
  const { formatCurrency, formatKwh, formatPercent } = useAppFormatters();

  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>(settings.defaultDashboardPeriod);

  useEffect(() => {
    setDashboardPeriod(settings.defaultDashboardPeriod);
  }, [settings.defaultDashboardPeriod]);

  const today = getTodayDateInputValue();
  const dailyReadings = useMemo(() => aggregateReadingsByDate(readings), [readings]);

  const todayReading = useMemo(() => dailyReadings.find((reading) => reading.date === today), [dailyReadings, today]);
  const filteredReadings = useMemo(
    () => filterDashboardReadings({ readings, today, period: dashboardPeriod }),
    [dashboardPeriod, readings, today],
  );
  const filteredSummary = useMemo(() => summarizeReadings(filteredReadings), [filteredReadings]);
  const chartData = useMemo(() => buildDailyEnergySeries({ readings, endDate: today, days: 7 }), [readings, today]);
  const monthReadings = useMemo(
    () => readings.filter((reading) => reading.date.startsWith(today.slice(0, 7))),
    [readings, today],
  );
  const previousMonthReadings = useMemo(() => {
    const previousMonthDate = addDaysToDate(`${today.slice(0, 7)}-01`, -1);
    const previousMonthPrefix = previousMonthDate.slice(0, 7);
    return readings.filter((reading) => reading.date.startsWith(previousMonthPrefix));
  }, [readings, today]);
  const monthSummary = useMemo(() => summarizeReadings(monthReadings), [monthReadings]);
  const previousMonthSummary = useMemo(() => summarizeReadings(previousMonthReadings), [previousMonthReadings]);
  const roi = useMemo(() => summarizeRoi({ profile: systemProfile, readings, costs }), [costs, readings, systemProfile]);
  const paybackForecast = useMemo(() => estimatePaybackForecast({ readings, remainingAmount: roi.remainingAmount, window: '30d' }), [readings, roi.remainingAmount]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <View
        style={{
          gap: 6,
          borderRadius: 8,
          borderCurve: 'continuous',
          backgroundColor: theme.header,
          padding: 20,
        }}
      >
        <Text style={{ color: theme.textOnDark, fontSize: 28, fontWeight: '800' }}>{systemProfile?.systemName ?? 'WattTrack'}</Text>
        <Text style={{ color: theme.textSubtle, fontSize: 14 }}>
          {systemProfile?.location ? `${systemProfile.location} | ` : ''}
          {systemProfile?.timezone ?? 'Asia/Manila'} | {formatMonthLabel(today)}
        </Text>
      </View>

      {readings.length === 0 ? (
        <View
          style={{
            gap: 10,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: theme.surface,
            padding: 20,
            boxShadow: theme.shadow,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>No readings yet</Text>
          <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>
            Head to Add and log your first grid and solar reading. Home will start answering today, month, and ROI questions as soon as data exists.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>Dashboard period</Text>
            <SegmentedControl options={dashboardPeriodOptions} value={dashboardPeriod} onChange={setDashboardPeriod} />
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>Today</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Solar generated" value={formatKwh(todayReading?.solarGenerationKwh ?? 0)} tone="accent" helper={todayReading ? formatShortDate(todayReading.date) : 'No reading today'} />
              <MetricCard label="Grid consumed" value={formatKwh(todayReading?.gridConsumptionKwh ?? 0)} />
              <MetricCard label="Estimated savings" value={formatCurrency(todayReading?.estimatedSavings ?? 0)} helper="Estimated" />
              <MetricCard label="Solar contribution" value={formatPercent(calculateSolarContribution(todayReading))} helper="Self-consumed solar share" />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{getPeriodLabel(dashboardPeriod)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Solar generated" value={formatKwh(filteredSummary.solarGeneratedKwh)} tone="accent" />
              <MetricCard label="Grid consumed" value={formatKwh(filteredSummary.gridConsumedKwh)} />
              <MetricCard label="Estimated savings" value={formatCurrency(filteredSummary.estimatedSavings)} helper="Estimated" />
              <MetricCard label="Solar contribution" value={formatPercent(filteredSummary.homeUsageKwh === 0 ? 0 : (filteredSummary.selfConsumedSolarKwh / filteredSummary.homeUsageKwh) * 100)} helper="Self-consumed solar share" />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>Monthly summary</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Solar generated" value={formatKwh(monthSummary.solarGeneratedKwh)} tone="accent" helper={getMonthComparison(monthSummary.solarGeneratedKwh, previousMonthSummary.solarGeneratedKwh)} />
              <MetricCard label="Grid consumed" value={formatKwh(monthSummary.gridConsumedKwh)} helper={getMonthComparison(monthSummary.gridConsumedKwh, previousMonthSummary.gridConsumedKwh)} />
              <MetricCard label="Estimated savings" value={formatCurrency(monthSummary.estimatedSavings)} helper="Estimated" />
              <MetricCard label="Estimated grid cost" value={formatCurrency(monthSummary.estimatedGridCost)} helper="Estimated" />
            </View>
          </View>

          <EnergyChart data={chartData} />

          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>ROI summary</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Total investment" value={formatCurrency(roi.totalCapitalInvestment)} />
              <MetricCard label="Total estimated savings" value={formatCurrency(roi.totalEstimatedSavings)} helper="Estimated" tone="accent" />
              <MetricCard label="Payback progress" value={formatPercent(roi.paybackProgress)} />
              <MetricCard label="Remaining to recover" value={formatCurrency(roi.remainingAmount)} />
              <MetricCard
                label="Estimated payback date"
                value={paybackForecast.estimatedPaybackDate ? formatShortDate(paybackForecast.estimatedPaybackDate) : 'TBD'}
                helper={paybackForecast.hasEnoughSavingsData ? 'Estimated from 30-day average savings' : 'Add more savings data'}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
