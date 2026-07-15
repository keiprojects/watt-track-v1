import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme/use-app-theme';

type WeatherIconProps = {
  weatherCode: number;
  isDay: boolean;
  size?: number;
};

type WeatherVisualKind = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export function getWeatherVisualKind(weatherCode: number): WeatherVisualKind {
  if (weatherCode === 0) {
    return 'clear';
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return 'partly-cloudy';
  }

  if (weatherCode === 3) {
    return 'cloudy';
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return 'fog';
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return 'rain';
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return 'snow';
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return 'storm';
  }

  return 'cloudy';
}

export function getWeatherLabel(weatherCode: number): string {
  if (weatherCode === 0) {
    return 'Clear sky';
  }

  if (weatherCode === 1) {
    return 'Mainly clear';
  }

  if (weatherCode === 2) {
    return 'Partly cloudy';
  }

  if (weatherCode === 3) {
    return 'Overcast';
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return 'Fog';
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return 'Drizzle';
  }

  if ([61, 63, 65, 66, 67].includes(weatherCode)) {
    return 'Rain';
  }

  if ([71, 73, 75, 77].includes(weatherCode)) {
    return 'Snow';
  }

  if ([80, 81, 82].includes(weatherCode)) {
    return 'Rain showers';
  }

  if ([85, 86].includes(weatherCode)) {
    return 'Snow showers';
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return 'Thunderstorm';
  }

  return 'Cloudy';
}

export function AnimatedWeatherIcon({
  weatherCode,
  isDay,
  size = 84,
}: WeatherIconProps) {
  const theme = useAppTheme();
  const visualKind = getWeatherVisualKind(weatherCode);
  const floatY = useSharedValue(0);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  const drift = useSharedValue(0);
  const fall = useSharedValue(0);
  const flash = useSharedValue(0.35);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.96, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    spin.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
    drift.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(6, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    fall.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, false);
    flash.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [drift, fall, flash, floatY, pulse, spin]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const spinningStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }, { scale: pulse.value }],
  }));
  const driftingStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }));
  const dropStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + fall.value * 0.75,
    transform: [{ translateY: fall.value * (size * 0.16) }],
  }));
  const dropStyleAlt = useAnimatedStyle(() => ({
    opacity: 0.2 + (1 - fall.value) * 0.8,
    transform: [{ translateY: (1 - fall.value) * (size * 0.16) }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 0.92 + flash.value * 0.12 }],
  }));

  const sunColor = isDay ? '#ffd14a' : '#d8e5ff';
  const cloudColor = theme.mode === 'dark' ? '#d6e0f7' : '#5c6f88';
  const rainColor = '#76a8ff';
  const snowColor = theme.mode === 'dark' ? '#eef5ff' : '#6b7f99';
  const stormColor = '#ffbf47';
  const glyphSize = size * 0.68;
  const cloudSize = size * 0.72;
  const accentGlow = visualKind === 'storm' ? 'rgba(255, 191, 71, 0.16)' : theme.accentSoft;

  return (
    <View
      style={{
        height: size,
        width: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          height: size * 0.88,
          width: size * 0.88,
          borderRadius: 999,
          backgroundColor: accentGlow,
        }}
      />

      {visualKind === 'clear' ? (
        <Animated.View style={spinningStyle}>
          <Ionicons name={isDay ? 'sunny' : 'moon'} size={glyphSize} color={sunColor} />
        </Animated.View>
      ) : null}

      {visualKind === 'partly-cloudy' ? (
        <>
          <Animated.View
            style={[
              spinningStyle,
              {
                position: 'absolute',
                top: size * 0.14,
                left: size * 0.12,
              },
            ]}
          >
            <Ionicons name={isDay ? 'sunny' : 'moon'} size={size * 0.32} color={sunColor} />
          </Animated.View>
          <Animated.View style={floatingStyle}>
            <Ionicons name={isDay ? 'partly-sunny' : 'cloudy-night'} size={glyphSize} color={cloudColor} />
          </Animated.View>
        </>
      ) : null}

      {(visualKind === 'cloudy' || visualKind === 'fog') ? (
        <>
          <Animated.View style={[floatingStyle, driftingStyle]}>
            <Ionicons name="cloud" size={cloudSize} color={cloudColor} />
          </Animated.View>
          {visualKind === 'fog' ? (
            <Animated.View
              style={[
                driftingStyle,
                {
                  position: 'absolute',
                  bottom: size * 0.18,
                  flexDirection: 'row',
                  gap: 6,
                },
              ]}
            >
              <Ionicons name="remove" size={size * 0.18} color={cloudColor} />
              <Ionicons name="remove" size={size * 0.22} color={cloudColor} />
            </Animated.View>
          ) : null}
        </>
      ) : null}

      {visualKind === 'rain' ? (
        <>
          <Animated.View style={floatingStyle}>
            <Ionicons name="rainy" size={glyphSize} color={cloudColor} />
          </Animated.View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: size * 0.06,
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Animated.View style={dropStyle}>
              <Ionicons name="water" size={size * 0.16} color={rainColor} />
            </Animated.View>
            <Animated.View style={dropStyleAlt}>
              <Ionicons name="water" size={size * 0.18} color={rainColor} />
            </Animated.View>
            <Animated.View style={dropStyle}>
              <Ionicons name="water" size={size * 0.16} color={rainColor} />
            </Animated.View>
          </View>
        </>
      ) : null}

      {visualKind === 'storm' ? (
        <>
          <Animated.View style={floatingStyle}>
            <Ionicons name="thunderstorm" size={glyphSize} color={cloudColor} />
          </Animated.View>
          <Animated.View
            style={[
              flashStyle,
              {
                position: 'absolute',
                bottom: size * 0.08,
              },
            ]}
          >
            <Ionicons name="flash" size={size * 0.3} color={stormColor} />
          </Animated.View>
        </>
      ) : null}

      {visualKind === 'snow' ? (
        <>
          <Animated.View style={floatingStyle}>
            <Ionicons name="cloud" size={cloudSize} color={cloudColor} />
          </Animated.View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: size * 0.08,
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Animated.View style={[dropStyle, driftingStyle]}>
              <Ionicons name="snow" size={size * 0.17} color={snowColor} />
            </Animated.View>
            <Animated.View style={dropStyleAlt}>
              <Ionicons name="snow" size={size * 0.19} color={snowColor} />
            </Animated.View>
            <Animated.View style={[dropStyle, driftingStyle]}>
              <Ionicons name="snow" size={size * 0.17} color={snowColor} />
            </Animated.View>
          </View>
        </>
      ) : null}
    </View>
  );
}
