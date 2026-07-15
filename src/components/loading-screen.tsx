import { Image, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SkeletonBlock } from '@/components/app-ui';

const logoMark = require('../../assets/branding/logo-mark.png');
const logoT = require('../../assets/branding/logo-t.png');
const BRAND_BACKGROUND = '#04111d';

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = 'Powering up Watt Track...' }: LoadingScreenProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.25);
  const glowScale = useSharedValue(0.9);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.back(1.2)) });
    glowOpacity.value = withDelay(
      250,
      withRepeat(
        withSequence(
          withTiming(0.92, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    glowScale.value = withDelay(
      250,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.92, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [glowOpacity, glowScale, logoOpacity, logoScale]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowOrbStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const glowingTStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        backgroundColor: BRAND_BACKGROUND,
        padding: 24,
      }}
    >
      <View
        style={{
          width: 320,
          maxWidth: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 8,
              right: 34,
              width: 128,
              height: 128,
              borderRadius: 999,
              backgroundColor: 'rgba(45, 212, 191, 0.22)',
            },
            glowOrbStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              width: '100%',
              aspectRatio: 714 / 434,
            },
            logoAnimatedStyle,
          ]}
        >
          <Image
            source={logoMark}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
          <Animated.Image
            source={logoT}
            resizeMode="contain"
            style={[
              {
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100%',
                shadowColor: '#5eead4',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 24,
              },
              glowingTStyle,
            ]}
          />
        </Animated.View>
      </View>
      <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
      <View
        style={{
          width: 320,
          maxWidth: '100%',
          gap: 14,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SkeletonBlock height={92} style={{ flex: 1, backgroundColor: 'rgba(22, 31, 46, 0.92)' }} />
          <SkeletonBlock height={92} style={{ flex: 1, backgroundColor: 'rgba(22, 31, 46, 0.92)' }} />
        </View>
        <SkeletonBlock height={148} style={{ backgroundColor: 'rgba(22, 31, 46, 0.92)' }} />
      </View>
    </View>
  );
}
