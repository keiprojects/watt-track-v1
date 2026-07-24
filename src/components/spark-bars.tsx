import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type SparkBarsProps = {
  values: number[];
  highlightIndex?: number;
  height?: number;
};

function sanitizeValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function SparkBars({ values, highlightIndex = values.length - 1, height = 148 }: SparkBarsProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const normalizedValues = values.length > 0 ? values.map(sanitizeValue) : [0];
  const safeHighlightIndex = Math.min(Math.max(0, highlightIndex), normalizedValues.length - 1);
  const chartWidth = Math.max(260, windowWidth - 76);
  const maxDataValue = Math.max(1, ...normalizedValues);
  const chartMaxValue = Math.max(1, Math.ceil(maxDataValue * 1.18 * 10) / 10);
  const inactiveBarColor = theme.mode === 'dark' ? 'rgba(214, 255, 77, 0.34)' : 'rgba(23, 105, 232, 0.28)';
  const barWidth = normalizedValues.length > 8 ? 16 : normalizedValues.length > 6 ? 20 : 24;
  const spacing = Math.max(12, (chartWidth - normalizedValues.length * barWidth - 30) / Math.max(normalizedValues.length, 1));

  const chartData = useMemo(
    () =>
      normalizedValues.map((value, index) => ({
        value,
        frontColor: index === safeHighlightIndex ? theme.accent : inactiveBarColor,
        topLabelComponent:
          index === safeHighlightIndex
            ? () => (
                <View
                  style={{
                    minWidth: 44,
                    alignItems: 'center',
                    borderRadius: 10,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceOverlay,
                    paddingHorizontal: 7,
                    paddingVertical: 4,
                    boxShadow: theme.shadow,
                  }}
                >
                  <Text
                    selectable
                    numberOfLines={1}
                    style={{
                      color: theme.text,
                      fontSize: 10,
                      fontFamily: fontFamilies.bodyStrong,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {value >= 10 ? value.toFixed(1) : value.toFixed(2)}
                  </Text>
                </View>
              )
            : undefined,
      })),
    [inactiveBarColor, normalizedValues, safeHighlightIndex, theme],
  );

  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: theme.surfaceMuted,
        paddingTop: 8,
      }}
    >
      <BarChart
        data={chartData}
        width={chartWidth}
        height={height}
        maxValue={chartMaxValue}
        noOfSections={3}
        barWidth={barWidth}
        spacing={spacing}
        initialSpacing={15}
        endSpacing={15}
        barBorderTopLeftRadius={barWidth / 2}
        barBorderTopRightRadius={barWidth / 2}
        yAxisThickness={0}
        xAxisThickness={0}
        hideYAxisText
        hideRules={false}
        rulesType="solid"
        rulesColor={theme.chartGrid}
        topLabelContainerStyle={{ width: 54, marginLeft: -15, marginBottom: 4 }}
        yAxisExtraHeight={34}
        showScrollIndicator={false}
        disableScroll={normalizedValues.length <= 8}
        scrollToEnd
        isAnimated
        animationDuration={520}
      />
    </View>
  );
}
