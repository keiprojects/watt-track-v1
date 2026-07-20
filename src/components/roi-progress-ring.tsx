import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type RoiProgressRingProps = {
  progress: number;
  size?: number;
};

export function RoiProgressRing({ progress, size = 108 }: RoiProgressRingProps) {
  const theme = useAppTheme();
  const markerCount = 30;
  const markerSize = Math.max(5, Math.round(size * 0.065));
  const radius = size * 0.41;
  const center = size / 2;
  const normalizedProgress = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const activeMarkers = Math.round((normalizedProgress / 100) * markerCount);

  return (
    <View style={{ height: size, width: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: markerCount }).map((_, index) => {
        const angle = (index / markerCount) * Math.PI * 2 - Math.PI / 2;
        const left = center + Math.cos(angle) * radius - markerSize / 2;
        const top = center + Math.sin(angle) * radius - markerSize / 2;
        const active = index < activeMarkers;

        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left,
              top,
              height: markerSize,
              width: markerSize,
              borderRadius: 999,
              backgroundColor: active ? theme.accent : theme.ringTrack,
              boxShadow: active ? `0 0 10px ${theme.accentGlow}` : undefined,
            }}
          />
        );
      })}

      <View
        style={{
          height: size * 0.62,
          width: size * 0.62,
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
    </View>
  );
}
