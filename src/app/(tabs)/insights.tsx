import { ScrollView, Text, View } from 'react-native';

import { MetricCard } from '@/components/metric-card';
import { summarizeReadings, summarizeRoi } from '@/services/calculation.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { formatCurrency, formatKwh, formatPercent } from '@/utils/format';

export default function InsightsScreen() {
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);

  const summary = summarizeReadings(readings);
  const roi = summarizeRoi({ profile: systemProfile, readings, costs });
  const averageDailySavings = readings.length === 0 ? 0 : roi.totalEstimatedSavings / readings.length;
  const solarContribution = summary.homeUsageKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.homeUsageKwh) * 100;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>Insights</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>All-time performance based on the readings stored on this device.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Energy</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard label="Solar generated" value={formatKwh(summary.solarGeneratedKwh)} tone="accent" />
          <MetricCard label="Grid consumed" value={formatKwh(summary.gridConsumedKwh)} />
          <MetricCard label="Home usage" value={formatKwh(summary.homeUsageKwh)} />
          <MetricCard label="Solar contribution" value={formatPercent(solarContribution)} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Financial</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard label="Estimated savings" value={formatCurrency(roi.totalEstimatedSavings)} helper="Estimated" tone="accent" />
          <MetricCard label="Average daily savings" value={formatCurrency(averageDailySavings)} helper="Estimated" />
          <MetricCard label="Net benefit" value={formatCurrency(roi.netSavings)} />
          <MetricCard label="ROI" value={formatPercent(roi.roiPercentage)} />
        </View>
      </View>

      <View
        style={{
          gap: 8,
          borderRadius: 8,
          borderCurve: 'continuous',
          backgroundColor: '#ffffff',
          padding: 18,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>What&apos;s next</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          This first build slice covers offline setup, derived reading calculations, local persistence, history grouping, and core summary metrics. Range filters,
          cost management, and backup flows are the next pieces to layer in.
        </Text>
      </View>
    </ScrollView>
  );
}
