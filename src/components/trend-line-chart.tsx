import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type TrendLineChartProps = {
  values: number[];
  labels: string[];
  height?: number;
  highlightIndex?: number;
  callout?: string;
};

function sanitizeValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function TrendLineChart({
  values,
  labels,
  height = 200,
  highlightIndex = Math.max(0, values.length - 3),
  callout,
}: TrendLineChartProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const normalizedValues = values.length > 0 ? values.map(sanitizeValue) : [0];
  const normalizedLabels = normalizedValues.map((_, index) => labels[index] ?? '');
  const safeHighlightIndex = Math.min(Math.max(0, highlightIndex), normalizedValues.length - 1);
  const highlightedValue = normalizedValues[safeHighlightIndex] ?? 0;
  const chartWidth = Math.max(260, Math.min(windowWidth - 72, 380));
  const maxDataValue = Math.max(1, ...normalizedValues);
  const chartMaxValue = Math.max(1, Math.ceil(maxDataValue * 1.18 * 10) / 10);
  const pointSpacing = Math.max(34, (chartWidth - 30) / Math.max(normalizedValues.length - 1, 1));
  const inactivePointColor = theme.mode === 'dark' ? 'rgba(214, 255, 77, 0.48)' : 'rgba(23, 105, 232, 0.46)';

  const chartData = useMemo(
    () =>
      normalizedValues.map((value, index) => ({
        value,
        label: normalizedLabels[index],
        dataPointColor: index === safeHighlightIndex ? theme.accent : inactivePointColor,
        dataPointRadius: index === safeHighlightIndex ? 5 : 3,
      })),
    [inactivePointColor, normalizedLabels, normalizedValues, safeHighlightIndex, theme.accent],
  );

  const highlightedLabel = callout ?? `${highlightedValue.toFixed(highlightedValue >= 10 ? 1 : 2)} kWh`;

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          alignSelf: 'center',
          minWidth: 74,
          alignItems: 'center',
          borderRadius: 12,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceOverlay,
          paddingHorizontal: 10,
          paddingVertical: 6,
          boxShadow: theme.shadow,
        }}
      >
        <Text
          selectable
          numberOfLines={1}
          style={{
            color: theme.text,
            fontSize: 12,
            fontFamily: fontFamilies.bodyStrong,
            fontVariant: ['tabular-nums'],
          }}
        >
          {highlightedLabel}
        </Text>
      </View>

      <View style={{ alignSelf: 'center', overflow: 'hidden' }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={Math.max(140, height - 38)}
          maxValue={chartMaxValue}
          noOfSections={3}
          spacing={pointSpacing}
          initialSpacing={15}
          endSpacing={15}
          thickness={3}
          color={theme.accent}
          curved={normalizedValues.length > 2}
          areaChart
          startFillColor={theme.accent}
          endFillColor={theme.accent}
          startOpacity={theme.mode === 'dark' ? 0.24 : 0.18}
          endOpacity={0.02}
          dataPointsColor={inactivePointColor}
          dataPointsRadius={3}
          yAxisThickness={0}
          xAxisThickness={0}
          hideYAxisText
          rulesType="solid"
          rulesColor={theme.chartGrid}
          xAxisLabelTextStyle={{
            color: theme.textSubtle,
            fontSize: 10,
            fontFamily: fontFamilies.bodyStrong,
          }}
          showScrollIndicator={false}
          disableScroll={normalizedValues.length <= 7}
          scrollToEnd
          isAnimated
          animationDuration={520}
        />
      </View>
    </View>
  );
}
