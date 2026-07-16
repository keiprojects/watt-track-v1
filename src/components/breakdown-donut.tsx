import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

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

export function BreakdownDonut({
  centerValue,
  centerLabel,
  segments,
}: BreakdownDonutProps) {
  const theme = useAppTheme();
  const ringSize = 148;
  const markerSize = 8;
  const markerCount = 56;
  const ringRadius = 60;
  const center = ringSize / 2;
  const markerColors = useMemo(() => {
    const positiveSegments = segments
      .map((segment) => ({
        ...segment,
        amount: Number.isFinite(segment.amount) && segment.amount > 0 ? segment.amount : 0,
      }))
      .filter((segment) => segment.amount > 0);

    if (positiveSegments.length === 0) {
      return [];
    }

    const total = positiveSegments.reduce((sum, segment) => sum + segment.amount, 0);
    const allocations = positiveSegments.map((segment) => {
      const exact = (segment.amount / total) * markerCount;
      const baseCount = Math.floor(exact);

      return {
        color: segment.color,
        count: Math.max(1, baseCount),
        remainder: exact - baseCount,
      };
    });

    let assigned = allocations.reduce((sum, segment) => sum + segment.count, 0);

    while (assigned > markerCount) {
      const removable = allocations
        .map((segment, index) => ({ ...segment, index }))
        .filter((segment) => segment.count > 1)
        .sort((left, right) => {
          if (right.count !== left.count) {
            return right.count - left.count;
          }

          return left.remainder - right.remainder;
        })[0];

      if (!removable) {
        break;
      }

      allocations[removable.index].count -= 1;
      assigned -= 1;
    }

    if (assigned < markerCount) {
      const rankedIndices = allocations
        .map((segment, index) => ({ index, remainder: segment.remainder }))
        .sort((left, right) => right.remainder - left.remainder)
        .map((segment) => segment.index);

      for (let offset = 0; assigned < markerCount; offset += 1) {
        const nextIndex = rankedIndices[offset % rankedIndices.length] ?? 0;
        allocations[nextIndex].count += 1;
        assigned += 1;
      }
    }

    return allocations.flatMap((segment) => Array.from({ length: segment.count }, () => segment.color));
  }, [segments]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <View style={{ height: ringSize, width: ringSize, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            height: ringSize,
            width: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 12,
            borderColor: theme.ringTrack,
          }}
        />
        {markerColors.map((color, index) => {
          const angle = (index / markerCount) * Math.PI * 2 - Math.PI / 2;
          const left = center + Math.cos(angle) * ringRadius - markerSize / 2;
          const top = center + Math.sin(angle) * ringRadius - markerSize / 2;

          return (
            <View
              key={`${color}-${index}`}
              style={{
                position: 'absolute',
                left,
                top,
                height: markerSize,
                width: markerSize,
                borderRadius: markerSize / 2,
                backgroundColor: color,
              }}
            />
          );
        })}
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
