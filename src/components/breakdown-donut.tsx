import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type BreakdownSegment = {
  color: string;
  label: string;
  value: string;
};

type BreakdownDonutProps = {
  centerValue: string;
  centerLabel: string;
  segments: BreakdownSegment[];
};

export function BreakdownDonut({
  centerValue,
  centerLabel,
  segments,
}: BreakdownDonutProps) {
  const theme = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <View style={{ height: 148, width: 148, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            height: 148,
            width: 148,
            borderRadius: 74,
            borderWidth: 12,
            borderColor: theme.ringTrack,
          }}
        />
        {segments.slice(0, 4).map((segment, index) => (
          <View
            key={segment.label}
            style={{
              position: 'absolute',
              height: 148,
              width: 148,
              borderRadius: 74,
              borderWidth: 12,
              borderColor: segment.color,
              borderTopColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: [{ rotate: `${index * 90 - 35}deg` }],
            }}
          />
        ))}
        <View
          style={{
            height: 88,
            width: 88,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 44,
            backgroundColor: theme.surfaceRaised,
          }}
        >
          <Text selectable style={{ color: theme.text, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {centerValue}
          </Text>
          <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '700' }}>{centerLabel}</Text>
        </View>
      </View>

      <View style={{ flex: 1, gap: 10 }}>
        {segments.map((segment) => (
          <View key={segment.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: segment.color }} />
              <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>{segment.label}</Text>
            </View>
            <Text selectable style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>
              {segment.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
