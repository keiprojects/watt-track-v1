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

const logoMark = require('../../assets/branding/logo-mark.png');
const logoT = require('../../assets/branding/logo-t.png');
const BRAND_BACKGROUND = '#04111d';

type BootSplashProps = {
  onReady?: () => void;
};

export function BootSplash({ onReady }: BootSplashProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.25);
  const glowScale = useSharedValue(0.9);

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
        backgroundColor: BRAND_BACKGROUND,
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
              backgroundColor: 'rgba(45, 212, 191, 0.22)',
            },
            glowAnimatedStyle,
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
          <Image source={logoMark} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
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
              },
              glowAnimatedStyle,
            ]}
          />
        </Animated.View>
      </Animated.View>

      <Text
        style={{
          color: '#c9ff45',
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
          color: '#f5f9ff',
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
