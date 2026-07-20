import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type SparkBarsProps = {
  values: number[];
  highlightIndex?: number;
  height?: number;
};

export function SparkBars({ values, highlightIndex = values.length - 1, height = 132 }: SparkBarsProps) {
  const theme = useAppTheme();
  const maxValue = Math.max(1, ...values);
  const safeHighlightIndex = Math.min(Math.max(0, highlightIndex), Math.max(0, values.length - 1));

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          height,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          borderRadius: 22,
          borderCurve: 'continuous',
          backgroundColor: theme.surfaceMuted,
          paddingHorizontal: 12,
          paddingTop: 14,
          paddingBottom: 12,
        }}
      >
        {values.map((value, index) => {
          const active = index === safeHighlightIndex;
          const barHeight = Math.max((value / maxValue) * (height - 44), 12);

          return (
            <View key={`${index}-${value}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              {active ? (
                <Text selectable style={{ color: theme.accent, fontSize: 10, fontFamily: fontFamilies.bodyStrong }}>
                  {value >= 10 ? value.toFixed(1) : value.toFixed(2)}
                </Text>
              ) : (
                <View style={{ height: 12 }} />
              )}
              <View
                style={{
                  width: '100%',
                  maxWidth: 24,
                  height: barHeight,
                  borderRadius: 999,
                  backgroundColor: active ? theme.accent : theme.primaryChart,
                  opacity: active ? 1 : 0.42,
                  boxShadow: active ? `0 0 18px ${theme.accentGlow}` : undefined,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
