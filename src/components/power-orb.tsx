import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type PowerOrbProps = {
  size?: number;
};

export function PowerOrb({ size = 128 }: PowerOrbProps) {
  const theme = useAppTheme();
  const outerSize = size;
  const midSize = Math.round(size * 0.76);
  const innerSize = Math.round(size * 0.48);

  return (
    <View style={{ height: outerSize, width: outerSize, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          height: outerSize,
          width: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: 10,
          borderColor: theme.ringTrack,
        }}
      />
      <View
        style={{
          position: 'absolute',
          height: outerSize,
          width: outerSize,
          borderRadius: outerSize / 2,
          borderWidth: 10,
          borderColor: theme.accent,
          borderLeftColor: theme.ringTrack,
          borderBottomColor: theme.ringTrack,
          transform: [{ rotate: '-28deg' }],
          boxShadow: `0 0 24px ${theme.accentGlow}`,
        }}
      />
      <View
        style={{
          height: midSize,
          width: midSize,
          borderRadius: midSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceOverlay,
        }}
      >
        <View
          style={{
            height: innerSize,
            width: innerSize,
            borderRadius: innerSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accent,
          }}
        >
          <Ionicons name="flash" size={Math.round(size * 0.24)} color="#0a101b" />
        </View>
      </View>
    </View>
  );
}
