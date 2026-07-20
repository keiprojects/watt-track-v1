import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type BreakdownSegment = {
  amount: number;
  color: string;
  label: string;
  value: string;
};

type BreakdownDonutProps = {
  centerValue: string;
  centerLabel: string;
  segments: BreakdownSegment[];
};

function sanitizeAmount(amount: number): number {
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function BreakdownDonut({ centerValue, centerLabel, segments }: BreakdownDonutProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const positiveSegments = segments.map((segment) => ({ ...segment, amount: sanitizeAmount(segment.amount) }));
  const total = positiveSegments.reduce((sum, segment) => sum + segment.amount, 0);
  const maxSegment = Math.max(1, ...positiveSegments.map((segment) => segment.amount));
  const radius = Math.max(76, Math.min(96, (windowWidth - 150) / 2));
  const innerRadius = radius * 0.64;

  const chartData = useMemo(
    () =>
      total > 0
        ? positiveSegments
            .filter((segment) => segment.amount > 0)
            .map((segment) => ({
              value: segment.amount,
              color: segment.color,
              text: segment.label,
            }))
        : [{ value: 1, color: theme.ringTrack, text: 'No data' }],
    [positiveSegments, theme.ringTrack, total],
  );

  return (
    <View style={{ gap: 20 }}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceMuted,
          paddingVertical: 20,
        }}
      >
        <PieChart
          data={chartData}
          donut
          radius={radius}
          innerRadius={innerRadius}
          innerCircleColor={theme.surfaceMuted}
          focusOnPress={total > 0}
          isAnimated
          animationDuration={520}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Text
                selectable
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  maxWidth: innerRadius * 1.5,
                  color: theme.text,
                  fontSize: 30,
                  lineHeight: 36,
                  fontFamily: fontFamilies.display,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {centerValue}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
                {centerLabel}
              </Text>
            </View>
          )}
        />
      </View>

      <View style={{ gap: 14 }}>
        {positiveSegments.map((segment) => {
          const percent = total === 0 ? 0 : (segment.amount / total) * 100;
          const relativeWidth = Math.max(segment.amount > 0 ? 8 : 0, (segment.amount / maxSegment) * 100);

          return (
            <View key={segment.label} style={{ gap: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ height: 12, width: 12, borderRadius: 999, backgroundColor: segment.color }} />
                  <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>{segment.label}</Text>
                </View>
                <Text selectable style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
                  {segment.value}
                </Text>
              </View>
              <View style={{ height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: theme.surfaceRaised }}>
                <View style={{ height: '100%', width: `${relativeWidth}%`, borderRadius: 999, backgroundColor: segment.color }} />
              </View>
              <Text style={{ color: theme.textSubtle, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>{percent.toFixed(1)}% of displayed flow</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
