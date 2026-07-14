import { Text, View } from 'react-native';

import { useAppFormatters } from '@/utils/format';

type EnergyChartDatum = {
  date: string;
  solarGenerationKwh: number;
  gridConsumptionKwh: number;
};

type EnergyChartProps = {
  data: EnergyChartDatum[];
};

function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00`));
}

export function EnergyChart({ data }: EnergyChartProps) {
  const { formatKwh } = useAppFormatters();
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.solarGenerationKwh, item.gridConsumptionKwh]));

  return (
    <View
      style={{
        gap: 14,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: '#ffffff',
        padding: 18,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Last 7 days</Text>
        <Text style={{ color: '#475569', fontSize: 14, lineHeight: 21 }}>Solar generation versus grid consumption by reading date.</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: '#0f766e' }} />
          <Text style={{ color: '#334155', fontSize: 13, fontWeight: '600' }}>Solar</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: '#2563eb' }} />
          <Text style={{ color: '#334155', fontSize: 13, fontWeight: '600' }}>Grid</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, minHeight: 200 }}>
        {data.map((item) => {
          const solarHeight = Math.max((item.solarGenerationKwh / maxValue) * 144, item.solarGenerationKwh > 0 ? 8 : 0);
          const gridHeight = Math.max((item.gridConsumptionKwh / maxValue) * 144, item.gridConsumptionKwh > 0 ? 8 : 0);

          return (
            <View key={item.date} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              <View style={{ height: 144, width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
                <View style={{ width: 14, height: solarHeight, borderRadius: 999, backgroundColor: '#0f766e' }} />
                <View style={{ width: 14, height: gridHeight, borderRadius: 999, backgroundColor: '#2563eb' }} />
              </View>
              <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>{formatDayLabel(item.date)}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>{formatKwh(item.solarGenerationKwh + item.gridConsumptionKwh)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
