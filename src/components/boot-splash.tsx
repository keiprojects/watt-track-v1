import { useEffect } from 'react';
import { Image, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme/use-app-theme';

const logoLight = require('../../assets/splash/splash-logo-light.png');
const logoDark = require('../../assets/splash/splash-logo-dark.png');

type BootSplashProps = {
  onReady?: () => void;
};

export function BootSplash({ onReady }: BootSplashProps) {
  const theme = useAppTheme();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.25);
  const glowScale = useSharedValue(0.9);
  const isDark = theme.mode === 'dark';
  const logo = isDark ? logoDark : logoLight;

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.back(1.2)),
    });
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

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View
      onLayout={onReady}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        backgroundColor: isDark ? '#04111d' : '#f4f8fb',
        padding: 24,
      }}
    >
      <Animated.View
        style={{
          width: 320,
          maxWidth: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 8,
              right: 34,
              width: 128,
              height: 128,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(45, 212, 191, 0.22)' : 'rgba(37, 99, 235, 0.12)',
            },
            glowAnimatedStyle,
          ]}
        />

        <Animated.View
          style={[
            {
              width: '100%',
              aspectRatio: 1031 / 561,
            },
            logoAnimatedStyle,
          ]}
        >
          <Image source={logo} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
        </Animated.View>
      </Animated.View>

      <Text
        style={{
          color: isDark ? '#c9ff45' : '#1d4ed8',
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Local-first solar tracking
      </Text>
      <Text
        style={{
          color: theme.text,
          fontSize: 15,
          fontWeight: '500',
          textAlign: 'center',
        }}
      >
        Powering up your solar dashboard…
      </Text>
    </Animated.View>
  );
}
