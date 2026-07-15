import { Text, View, useWindowDimensions } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type TrendLineChartProps = {
  values: number[];
  labels: string[];
  height?: number;
  highlightIndex?: number;
  callout?: string;
};

export function TrendLineChart({
  values,
  labels,
  height = 180,
  highlightIndex = Math.max(0, values.length - 3),
  callout,
}: TrendLineChartProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 92, 300);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(0, ...values);
  const range = Math.max(1, maxValue - minValue);
  const leftPadding = 6;
  const rightPadding = 6;
  const topPadding = 14;
  const bottomPadding = 22;
  const drawableWidth = chartWidth - leftPadding - rightPadding;
  const drawableHeight = height - topPadding - bottomPadding;
  const points = values.map((value, index) => ({
    x: leftPadding + (drawableWidth / Math.max(values.length - 1, 1)) * index,
    y: topPadding + drawableHeight - ((value - minValue) / range) * drawableHeight,
    value,
    label: labels[index] ?? '',
  }));
  const highlight = points[highlightIndex];

  return (
    <View style={{ width: chartWidth, height, alignSelf: 'center' }}>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <View
          key={ratio}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: topPadding + drawableHeight * ratio,
            height: 1,
            backgroundColor: theme.chartGrid,
          }}
        />
      ))}

      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={`${point.label}-${next.label}`}
            style={{
              position: 'absolute',
              left: point.x + dx / 2 - length / 2,
              top: point.y + dy / 2 - 1,
              width: length,
              height: 2,
              borderRadius: 999,
              backgroundColor: theme.accent,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {points.map((point, index) => (
        <View
          key={point.label}
          style={{
            position: 'absolute',
            left: point.x - (index === highlightIndex ? 5 : 3.5),
            top: point.y - (index === highlightIndex ? 5 : 3.5),
            height: index === highlightIndex ? 10 : 7,
            width: index === highlightIndex ? 10 : 7,
            borderRadius: 999,
            backgroundColor: index === highlightIndex ? theme.accent : theme.textSubtle,
          }}
        />
      ))}

      {highlight ? (
        <View
          style={{
            position: 'absolute',
            left: Math.max(0, highlight.x - 34),
            top: Math.max(0, highlight.y - 42),
            minWidth: 68,
            alignItems: 'center',
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: theme.surfaceOverlay,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text selectable style={{ color: theme.text, fontSize: 12, fontWeight: '800' }}>
            {callout ?? `${highlight.value.toFixed(2)} kWh`}
          </Text>
        </View>
      ) : null}

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
        {labels.map((label) => (
          <Text key={label} style={{ color: theme.textSubtle, fontSize: 11, fontWeight: '700' }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
