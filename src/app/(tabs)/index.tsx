import { ScrollView, Text, View } from 'react-native';

import { MetricCard } from '@/components/metric-card';
import { calculateSolarContribution, estimatePaybackForecast, summarizeReadings, summarizeRoi } from '@/services/calculation.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { formatCurrency, formatKwh, formatPercent } from '@/utils/format';

export default function DashboardScreen() {
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);

  const today = getTodayDateInputValue();
  const todayReading = readings.find((reading) => reading.date === today);
  const monthPrefix = today.slice(0, 7);
  const monthReadings = readings.filter((reading) => reading.date.startsWith(monthPrefix));
  const monthSummary = summarizeReadings(monthReadings);
  const roi = summarizeRoi({ profile: systemProfile, readings, costs });
  const paybackForecast = estimatePaybackForecast({ readings, remainingAmount: roi.remainingAmount, window: '30d' });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <View
        style={{
          gap: 6,
          borderRadius: 8,
          borderCurve: 'continuous',
          backgroundColor: '#0f172a',
          padding: 20,
        }}
      >
        <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '800' }}>{systemProfile?.systemName ?? 'WattTrack'}</Text>
        <Text style={{ color: '#cbd5e1', fontSize: 14 }}>
          {systemProfile?.location ? `${systemProfile.location} | ` : ''}
          {systemProfile?.timezone ?? 'Asia/Manila'} | Offline-first
        </Text>
      </View>

      {readings.length === 0 ? (
        <View
          style={{
            gap: 10,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#ffffff',
            padding: 20,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>No readings yet</Text>
          <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
            Head to Add and log your first grid and solar reading. Once you do, Home will start calculating daily and monthly performance.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Today</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Solar generated" value={formatKwh(todayReading?.solarGenerationKwh ?? 0)} tone="accent" />
              <MetricCard label="Grid consumed" value={formatKwh(todayReading?.gridConsumptionKwh ?? 0)} />
              <MetricCard label="Estimated savings" value={formatCurrency(todayReading?.estimatedSavings ?? 0)} helper="Estimated" />
              <MetricCard
                label="Solar contribution"
                value={formatPercent(calculateSolarContribution(todayReading))}
                helper="Self-consumed solar share"
              />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>This month</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Solar generated" value={formatKwh(monthSummary.solarGeneratedKwh)} tone="accent" />
              <MetricCard label="Grid consumed" value={formatKwh(monthSummary.gridConsumedKwh)} />
              <MetricCard label="Estimated savings" value={formatCurrency(monthSummary.estimatedSavings)} helper="Estimated" />
              <MetricCard label="Estimated grid cost" value={formatCurrency(monthSummary.estimatedGridCost)} helper="Estimated" />
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>ROI</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Total investment" value={formatCurrency(roi.totalCapitalInvestment)} />
              <MetricCard label="Total savings" value={formatCurrency(roi.totalEstimatedSavings)} helper="Estimated" tone="accent" />
              <MetricCard label="Payback progress" value={formatPercent(roi.paybackProgress)} />
              <MetricCard label="Remaining to recover" value={formatCurrency(roi.remainingAmount)} />
              <MetricCard
                label="Est. payback date"
                value={paybackForecast.estimatedPaybackDate ? formatShortDate(paybackForecast.estimatedPaybackDate) : 'TBD'}
                helper={paybackForecast.hasEnoughSavingsData ? 'Based on 30-day average savings' : 'Add more savings data'}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
