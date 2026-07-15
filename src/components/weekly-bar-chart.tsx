import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type WeeklyBarChartDatum = {
  label: string;
  value: number;
};

type WeeklyBarChartProps = {
  data: WeeklyBarChartDatum[];
  highlightIndex?: number;
  valueLabel?: string;
  title?: string;
  unitLabel?: string;
};

export function WeeklyBarChart({
  data,
  highlightIndex = Math.max(0, data.length - 4),
  valueLabel,
  title,
  unitLabel = 'kWh',
}: WeeklyBarChartProps) {
  const theme = useAppTheme();
  const normalizedData = data.length > 0 ? data : [{ label: '-', value: 0 }];
  const maxValue = Math.max(1, ...normalizedData.map((item) => item.value));
  const safeHighlightIndex = Math.min(Math.max(0, highlightIndex), normalizedData.length - 1);
  const highlight = normalizedData[safeHighlightIndex];
  const axisValues = [maxValue, (maxValue * 2) / 3, maxValue / 3, 0].map((value) =>
    value === 0 ? '0' : value >= 10 ? value.toFixed(0) : value.toFixed(1),
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        {title ? (
          <Text style={{ color: theme.text, fontSize: 18, fontFamily: fontFamilies.displayMedium }}>{title}</Text>
        ) : (
          <View />
        )}
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
            <Text style={{ color: '#0a101b', fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>{unitLabel}</Text>
          </View>
          <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: theme.textSubtle, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>$</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
        <View style={{ gap: 18, paddingBottom: 20 }}>
          {axisValues.map((value) => (
            <Text key={value} style={{ color: theme.textSubtle, fontSize: 10, fontFamily: fontFamilies.bodyStrong }}>
              {value}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, minHeight: 150 }}>
            {normalizedData.map((item, index) => {
              const barHeight = Math.max((item.value / maxValue) * 118, 18);
              const active = index === safeHighlightIndex;

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
                      <Text selectable style={{ color: theme.text, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>
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
            {normalizedData.map((item) => (
              <Text
                key={item.label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  color: theme.textSubtle,
                  fontSize: 11,
                  fontFamily: fontFamilies.bodyStrong,
                }}
              >
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
