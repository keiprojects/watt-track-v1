import { Text, View } from 'react-native';

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
  const positiveSegments = segments.map((segment) => ({ ...segment, amount: sanitizeAmount(segment.amount) }));
  const total = positiveSegments.reduce((sum, segment) => sum + segment.amount, 0);
  const maxSegment = Math.max(1, ...positiveSegments.map((segment) => segment.amount));

  return (
    <View style={{ gap: 18 }}>
      <View
        style={{
          borderRadius: 24,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceMuted,
          padding: 16,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ color: theme.textSubtle, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>Total load</Text>
            <Text selectable style={{ color: theme.text, fontSize: 36, lineHeight: 42, fontFamily: fontFamilies.display }}>
              {centerValue}
            </Text>
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 15, paddingBottom: 7, fontFamily: fontFamilies.bodyStrong }}>{centerLabel}</Text>
        </View>

        <View
          style={{
            height: 18,
            flexDirection: 'row',
            overflow: 'hidden',
            borderRadius: 999,
            backgroundColor: theme.ringTrack,
          }}
        >
          {positiveSegments.map((segment) => {
            const widthPercent = total === 0 ? 0 : (segment.amount / total) * 100;

            return <View key={segment.label} style={{ width: `${widthPercent}%`, backgroundColor: segment.color }} />;
          })}
        </View>
      </View>

      <View style={{ gap: 12 }}>
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
