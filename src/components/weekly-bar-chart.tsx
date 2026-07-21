import { useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

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
  highlightIndex = Math.max(0, data.length - 1),
  valueLabel,
  title,
  unitLabel = 'kWh',
}: WeeklyBarChartProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const normalizedData = data.length > 0 ? data : [{ label: '-', value: 0 }];
  const safeHighlightIndex = Math.min(Math.max(0, highlightIndex), normalizedData.length - 1);
  const [focusedIndex, setFocusedIndex] = useState(safeHighlightIndex);

  useEffect(() => {
    setFocusedIndex(safeHighlightIndex);
  }, [safeHighlightIndex]);

  const maxDataValue = Math.max(1, ...normalizedData.map((item) => item.value));
  const chartMaxValue = Math.max(1, Math.ceil(maxDataValue * 1.18 * 10) / 10);
  const chartWidth = Math.max(238, windowWidth - 104);
  const inactiveBarColor = theme.mode === 'dark' ? 'rgba(214, 255, 77, 0.38)' : 'rgba(23, 105, 232, 0.30)';
  const activeValue = normalizedData[focusedIndex]?.value ?? 0;
  const activeValueLabel = focusedIndex === safeHighlightIndex && valueLabel
    ? valueLabel
    : `${activeValue >= 10 ? activeValue.toFixed(1) : activeValue.toFixed(2)} ${unitLabel}`;

  const chartData = useMemo(
    () =>
      normalizedData.map((item, index) => ({
        value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0,
        label: item.label,
        frontColor: index === focusedIndex ? theme.accent : inactiveBarColor,
        topLabelComponent:
          index === focusedIndex
            ? () => (
                <View
                  style={{
                    minWidth: 66,
                    alignItems: 'center',
                    borderRadius: 10,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceOverlay,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    boxShadow: theme.shadow,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: theme.text,
                      fontSize: 10,
                      fontFamily: fontFamilies.bodyStrong,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {activeValueLabel}
                  </Text>
                </View>
              )
            : undefined,
      })),
    [activeValueLabel, focusedIndex, inactiveBarColor, normalizedData, theme],
  );

  return (
    <View style={{ gap: 14 }}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ flex: 1, color: theme.text, fontSize: 18, fontFamily: fontFamilies.displayMedium }}>{title}</Text>
          <View
            style={{
              borderRadius: 999,
              borderCurve: 'continuous',
              backgroundColor: theme.surfaceRaised,
              paddingHorizontal: 11,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>{unitLabel}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ marginHorizontal: -2, overflow: 'hidden' }}>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={158}
          maxValue={chartMaxValue}
          noOfSections={3}
          barWidth={18}
          spacing={normalizedData.length > 7 ? 14 : 20}
          initialSpacing={12}
          endSpacing={18}
          barBorderTopLeftRadius={9}
          barBorderTopRightRadius={9}
          yAxisThickness={0}
          xAxisThickness={0}
          rulesType="solid"
          rulesColor={theme.chartGrid}
          yAxisTextStyle={{
            color: theme.textSubtle,
            fontSize: 10,
            fontFamily: fontFamilies.bodyStrong,
          }}
          xAxisLabelTextStyle={{
            color: theme.textSubtle,
            fontSize: 10,
            fontFamily: fontFamilies.bodyStrong,
          }}
          topLabelContainerStyle={{ width: 72, marginLeft: -27, marginBottom: 5 }}
          yAxisExtraHeight={36}
          showScrollIndicator={false}
          disableScroll={normalizedData.length <= 7}
          scrollToEnd
          isAnimated
          animationDuration={520}
          focusBarOnPress
          focusedBarConfig={{ color: theme.accent }}
          onPress={(_item: unknown, index: number) => setFocusedIndex(index)}
        />
      </View>
    </View>
  );
}
