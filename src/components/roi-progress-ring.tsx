import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { useAppTheme } from '@/theme/use-app-theme';

type RoiProgressRingProps = {
  progress: number;
  size?: number;
};

export function RoiProgressRing({ progress, size = 108 }: RoiProgressRingProps) {
  const theme = useAppTheme();
  const normalizedProgress = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const activeColor = theme.mode === 'light' ? '#5d9b00' : theme.accent;
  const radius = size / 2;
  const innerRadius = size * 0.32;
  const chartData = [
    { value: normalizedProgress, color: activeColor },
    { value: Math.max(0, 100 - normalizedProgress), color: theme.ringTrack },
  ];

  return (
    <View style={{ height: size, width: size, alignItems: 'center', justifyContent: 'center' }}>
      <PieChart
        data={chartData}
        donut
        radius={radius}
        innerRadius={innerRadius}
        innerCircleColor={theme.surfaceRaised}
        isAnimated
        animationDuration={520}
        centerLabelComponent={() => (
          <View
            style={{
              height: innerRadius * 1.72,
              width: innerRadius * 1.72,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
            }}
          >
            <Ionicons name="trending-up" size={Math.round(size * 0.28)} color={theme.textMuted} />
          </View>
        )}
      />
    </View>
  );
}
