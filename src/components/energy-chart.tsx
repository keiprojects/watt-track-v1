import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { IconBadge, SectionTitle, StatPill } from '@/components/app-ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatWeekdayLabel } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

type EnergyChartDatum = {
  date: string;
  solarGenerationKwh: number;
  gridConsumptionKwh: number;
};

type EnergyChartProps = {
  data: EnergyChartDatum[];
  title?: string;
  description?: string;
};

function formatDayLabel(date: string): string {
  return formatWeekdayLabel(date);
}

export function EnergyChart({
  data,
  title = 'Daily usage',
  description = 'Solar generation versus grid consumption.',
}: EnergyChartProps) {
  const theme = useAppTheme();
  const { formatKwh } = useAppFormatters();
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.solarGenerationKwh, item.gridConsumptionKwh]));
  const solarAverage = data.length === 0 ? 0 : data.reduce((sum, item) => sum + item.solarGenerationKwh, 0) / data.length;
  const gridAverage = data.length === 0 ? 0 : data.reduce((sum, item) => sum + item.gridConsumptionKwh, 0) / data.length;
  const peakSolarDay = data.reduce<EnergyChartDatum | undefined>((peak, item) => {
    if (!peak || item.solarGenerationKwh > peak.solarGenerationKwh) {
      return item;
    }

    return peak;
  }, undefined);

  return (
    <View
      style={{
        gap: 18,
        borderRadius: 26,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        padding: 20,
        boxShadow: theme.shadow,
      }}
    >
      <SectionTitle title={title} description={description} icon="bar-chart-outline" />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatPill icon="sunny-outline" label="Avg solar" value={formatKwh(solarAverage)} tone="accent" />
        <StatPill icon="transmission-tower" iconFamily="material-community" label="Avg grid" value={formatKwh(gridAverage)} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconBadge icon="sunny-outline" size={28} />
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Solar</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              height: 28,
              width: 28,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: theme.neutralSoft,
            }}
          >
            <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: theme.secondaryChart }} />
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>Grid</Text>
        </View>
      </View>

      <View
        style={{
          gap: 14,
          borderRadius: 24,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceMuted,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View>
            <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '700' }}>Peak solar</Text>
            <Text selectable style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
              {peakSolarDay ? formatKwh(peakSolarDay.solarGenerationKwh) : formatKwh(0)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '700' }}>Day</Text>
            <Text selectable style={{ color: theme.accent, fontSize: 14, fontWeight: '800' }}>
              {peakSolarDay ? formatDayLabel(peakSolarDay.date) : '--'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <View
              key={ratio}
              style={{
                position: 'absolute',
                top: 24 + ratio * 144,
                left: 16,
                right: 16,
                height: 1,
                backgroundColor: theme.chartGrid,
              }}
            />
          ))}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 10,
              minHeight: 192,
            }}
          >
        {data.map((item) => {
              const solarHeight = Math.max((item.solarGenerationKwh / maxValue) * 144, item.solarGenerationKwh > 0 ? 10 : 0);
              const gridHeight = Math.max((item.gridConsumptionKwh / maxValue) * 144, item.gridConsumptionKwh > 0 ? 10 : 0);
              const isPeakSolar = peakSolarDay?.date === item.date;

              return (
                <Animated.View
                  key={item.date}
                  entering={FadeInUp.duration(280)}
                  style={{ flex: 1, alignItems: 'center', gap: 8 }}
                >
                  <View
                    style={{
                      height: 144,
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: solarHeight,
                        borderRadius: 999,
                        backgroundColor: isPeakSolar ? theme.accent : theme.primaryChart,
                        boxShadow: isPeakSolar ? `0 0 18px ${theme.accentGlow}` : undefined,
                      }}
                    />
                    <View
                      style={{
                        width: 16,
                        height: gridHeight,
                        borderRadius: 999,
                        backgroundColor: theme.secondaryChart,
                      }}
                    />
                  </View>
                  <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '700' }}>{formatDayLabel(item.date)}</Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 11 }}>{formatKwh(item.solarGenerationKwh + item.gridConsumptionKwh)}</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '700' }}>Grid share</Text>
          <Text selectable style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
            {formatKwh(data.reduce((sum, item) => sum + item.gridConsumptionKwh, 0))}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 4, alignItems: 'flex-end' }}>
          <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '700' }}>Solar share</Text>
          <Text selectable style={{ color: theme.accent, fontSize: 16, fontWeight: '800' }}>
            {formatKwh(data.reduce((sum, item) => sum + item.solarGenerationKwh, 0))}
          </Text>
        </View>
      </View>
    </View>
  );
}
