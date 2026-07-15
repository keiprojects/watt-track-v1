import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type WeeklyBarChartDatum = {
  label: string;
  value: number;
};

type WeeklyBarChartProps = {
  data: WeeklyBarChartDatum[];
  highlightIndex?: number;
  valueLabel?: string;
};

export function WeeklyBarChart({
  data,
  highlightIndex = Math.max(0, data.length - 4),
  valueLabel,
}: WeeklyBarChartProps) {
  const theme = useAppTheme();
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const highlight = data[highlightIndex];

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Daily Usage</Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            borderRadius: 999,
            backgroundColor: theme.surfaceRaised,
            padding: 4,
          }}
        >
          <View
            style={{
              borderRadius: 999,
              backgroundColor: theme.accent,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#0a101b', fontSize: 11, fontWeight: '800' }}>kWh</Text>
          </View>
          <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: '800' }}>$</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
        <View style={{ gap: 18, paddingBottom: 20 }}>
          {[24, 16, 8, 0].map((value) => (
            <Text key={value} style={{ color: theme.textSubtle, fontSize: 10, fontWeight: '700' }}>
              {value}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, minHeight: 150 }}>
            {data.map((item, index) => {
              const barHeight = Math.max((item.value / maxValue) * 118, 18);
              const active = index === highlightIndex;

              return (
                <View key={item.label} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                  {active ? (
                    <View
                      style={{
                        borderRadius: 10,
                        borderCurve: 'continuous',
                        backgroundColor: theme.surfaceOverlay,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text selectable style={{ color: theme.text, fontSize: 11, fontWeight: '800' }}>
                        {valueLabel ?? `${highlight?.value.toFixed(1)} kWh`}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ height: 24 }} />
                  )}
                  <View
                    style={{
                      width: 18,
                      height: barHeight,
                      borderRadius: 999,
                      backgroundColor: active ? theme.accent : theme.accentSoft,
                      boxShadow: active ? `0 0 18px ${theme.accentGlow}` : undefined,
                    }}
                  />
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            {data.map((item) => (
              <Text key={item.label} style={{ flex: 1, textAlign: 'center', color: theme.textSubtle, fontSize: 11, fontWeight: '700' }}>
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
