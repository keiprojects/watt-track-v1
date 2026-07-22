import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { getWeatherVisualKind } from '@/components/weather-icon';
import type { CurrentWeatherSnapshot } from '@/services/weather.service';

const sunnyHeroImage = require('../../assets/images/solar-home-hero-card-sunny.png') as ImageSourcePropType;
const cloudyHeroImage = require('../../assets/images/solar-home-hero-card-cloudy.png') as ImageSourcePropType;
const rainyHeroImage = require('../../assets/images/solar-home-hero-card-rainy.png') as ImageSourcePropType;
const rainyNightHeroImage = require('../../assets/images/solar-home-hero-card-rainy-night.png') as ImageSourcePropType;
const nightHeroImage = require('../../assets/images/solar-home-hero-card-night.png') as ImageSourcePropType;

type HouseEnergyHeroProps = {
  weather?: CurrentWeatherSnapshot | null;
  isLoading?: boolean;
  height?: number;
};

type RainDropProps = {
  left: `${number}%`;
  delay: number;
  duration: number;
  travel: number;
};

type StarProps = {
  left: `${number}%`;
  top: number;
  size: number;
  delay: number;
};

const RAIN_DROPS: RainDropProps[] = [
  { left: '6%', delay: 0, duration: 880, travel: 108 },
  { left: '18%', delay: 180, duration: 980, travel: 116 },
  { left: '31%', delay: 80, duration: 900, travel: 112 },
  { left: '45%', delay: 260, duration: 960, travel: 118 },
  { left: '58%', delay: 120, duration: 900, travel: 110 },
  { left: '72%', delay: 320, duration: 1000, travel: 120 },
  { left: '86%', delay: 40, duration: 860, travel: 108 },
  { left: '96%', delay: 220, duration: 940, travel: 116 },
];

const SNOW_FLAKES: RainDropProps[] = [
  { left: '12%', delay: 0, duration: 2300, travel: 112 },
  { left: '28%', delay: 320, duration: 2700, travel: 106 },
  { left: '47%', delay: 160, duration: 2450, travel: 116 },
  { left: '66%', delay: 560, duration: 2850, travel: 108 },
  { left: '84%', delay: 260, duration: 2550, travel: 118 },
];

const NIGHT_SPARKLES: StarProps[] = [
  { left: '9%', top: 22, size: 2, delay: 0 },
  { left: '24%', top: 46, size: 1.7, delay: 340 },
  { left: '57%', top: 28, size: 2, delay: 700 },
  { left: '83%', top: 44, size: 1.6, delay: 160 },
];

function getFallbackIsNight() {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

function FallingRain({ left, delay, duration, travel }: RainDropProps) {
  const reducedMotion = useReducedMotion();
  const fall = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      fall.value = 0.5;
      return;
    }

    fall.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    );
  }, [delay, duration, fall, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.36 : interpolate(fall.value, [0, 0.14, 0.9, 1], [0, 0.48, 0.48, 0]),
    transform: [
      { translateY: fall.value * travel },
      { translateX: fall.value * -20 },
      { rotate: '14deg' },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          pointerEvents: 'none',
          position: 'absolute',
          left,
          top: -24,
          height: 40,
          width: 1.5,
          borderRadius: 999,
          backgroundColor: 'rgba(210, 232, 255, 0.82)',
        },
        style,
      ]}
    />
  );
}

function FallingSnow({ left, delay, duration, travel }: RainDropProps) {
  const reducedMotion = useReducedMotion();
  const fall = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      fall.value = 0.5;
      return;
    }

    fall.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, false),
    );
  }, [delay, duration, fall, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.58 : interpolate(fall.value, [0, 0.16, 0.88, 1], [0, 0.66, 0.66, 0]),
    transform: [
      { translateY: fall.value * travel },
      { translateX: Math.sin(fall.value * Math.PI * 2) * 8 },
    ],
  }));

  return (
    <Animated.View style={[{ pointerEvents: 'none', position: 'absolute', left, top: -12 }, style]}>
      <Ionicons name="snow" size={12} color="rgba(248, 252, 255, 0.94)" />
    </Animated.View>
  );
}

function Sparkle({ left, top, size, delay }: StarProps) {
  const reducedMotion = useReducedMotion();
  const twinkle = useSharedValue(0.58);

  useEffect(() => {
    if (reducedMotion) {
      twinkle.value = 0.8;
      return;
    }

    twinkle.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.42, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, reducedMotion, twinkle]);

  const style = useAnimatedStyle(() => ({
    opacity: twinkle.value,
    transform: [{ scale: 0.9 + twinkle.value * 0.16 }],
  }));

  return (
    <Animated.View
      style={[
        {
          pointerEvents: 'none',
          position: 'absolute',
          left,
          top,
          height: size,
          width: size,
          borderRadius: 999,
          backgroundColor: '#f9fbff',
        },
        style,
      ]}
    />
  );
}

export function HouseEnergyHero({ weather, isLoading = false, height = 172 }: HouseEnergyHeroProps) {
  const reducedMotion = useReducedMotion();
  const visualKind = weather ? getWeatherVisualKind(weather.weatherCode) : 'partly-cloudy';
  const isNight = weather ? !weather.isDay : getFallbackIsNight();
  const isRainy = visualKind === 'rain' || visualKind === 'storm' || (weather?.precipitationMm ?? 0) > 0;
  const isStormy = visualKind === 'storm';
  const isSnowy = visualKind === 'snow';
  const isCloudy = visualKind === 'cloudy' || visualKind === 'fog';
  const lightning = useSharedValue(0);
  const imageTransition = useSharedValue(1);

  const imageSource = (isRainy || isStormy) && isNight
    ? rainyNightHeroImage
    : isRainy || isStormy
      ? rainyHeroImage
      : isCloudy || isSnowy
        ? cloudyHeroImage
        : isNight
          ? nightHeroImage
          : sunnyHeroImage;
  const [currentImageSource, setCurrentImageSource] = useState<ImageSourcePropType>(imageSource);
  const [previousImageSource, setPreviousImageSource] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    if (imageSource === currentImageSource) {
      return;
    }

    if (reducedMotion) {
      setPreviousImageSource(null);
      setCurrentImageSource(imageSource);
      imageTransition.value = 1;
      return;
    }

    setPreviousImageSource(currentImageSource);
    setCurrentImageSource(imageSource);
    imageTransition.value = 0;
    imageTransition.value = withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) });

    const cleanupPreviousImage = setTimeout(() => {
      setPreviousImageSource(null);
    }, 720);

    return () => {
      clearTimeout(cleanupPreviousImage);
    };
  }, [currentImageSource, imageSource, imageTransition, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      lightning.value = 0;
      return;
    }

    lightning.value = isStormy
      ? withRepeat(
          withSequence(
            withTiming(0, { duration: 2300, easing: Easing.linear }),
            withTiming(0.62, { duration: 80, easing: Easing.linear }),
            withTiming(0, { duration: 130, easing: Easing.linear }),
            withTiming(0.42, { duration: 70, easing: Easing.linear }),
            withTiming(0, { duration: 1000, easing: Easing.linear }),
          ),
          -1,
          false,
        )
      : withTiming(0, { duration: 200 });
  }, [isStormy, lightning, reducedMotion]);

  const previousImageStyle = useAnimatedStyle(() => ({
    opacity: 1 - imageTransition.value,
  }));
  const currentImageStyle = useAnimatedStyle(() => ({
    opacity: previousImageSource ? imageTransition.value : 1,
  }));
  const lightningStyle = useAnimatedStyle(() => ({
    opacity: lightning.value,
  }));

  return (
    <View
      style={{
        width: '100%',
        height,
        overflow: 'hidden',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderCurve: 'continuous',
        borderBottomWidth: 1,
        borderColor: isNight || isRainy ? 'rgba(255,255,255,0.10)' : 'rgba(31,66,96,0.08)',
        backgroundColor: '#bfe4ff',
      }}
    >
      {previousImageSource ? (
        <Animated.Image
          source={previousImageSource}
          resizeMode="cover"
          style={[
            {
              position: 'absolute',
              inset: 0,
              height: '100%',
              width: '100%',
            },
            previousImageStyle,
          ]}
        />
      ) : null}
      <Animated.Image
        source={currentImageSource}
        resizeMode="cover"
        style={[
          {
            position: 'absolute',
            inset: 0,
            height: '100%',
            width: '100%',
          },
          currentImageStyle,
        ]}
      />

      {isNight && !isRainy && !isStormy && !isCloudy && !isSnowy
        ? NIGHT_SPARKLES.map((star) => <Sparkle key={`${star.left}-${star.top}`} {...star} />)
        : null}
      {isRainy ? RAIN_DROPS.map((drop) => <FallingRain key={`${drop.left}-${drop.delay}`} {...drop} />) : null}
      {isSnowy ? SNOW_FLAKES.map((flake) => <FallingSnow key={`${flake.left}-${flake.delay}`} {...flake} />) : null}

      {isLoading ? (
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 14,
            top: 14,
            height: 8,
            width: 58,
            borderRadius: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.34)',
          }}
        />
      ) : null}

      {isStormy ? (
        <Animated.View
          style={[
            {
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 244, 184, 0.34)',
            },
            lightningStyle,
          ]}
        />
      ) : null}
    </View>
  );
}
