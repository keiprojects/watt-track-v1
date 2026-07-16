import { useEffect, useEffectEvent, useState } from 'react';
import { Text, View } from 'react-native';

import { SkeletonBlock } from '@/components/app-ui';
import { AnimatedWeatherIcon, getWeatherVisualKind } from '@/components/weather-icon';
import { fetchCurrentWeather, type CurrentWeatherSnapshot } from '@/services/weather.service';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type CurrentWeatherCardProps = {
  location?: string;
};

function WeatherCardSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <SkeletonBlock height={76} width={76} borderRadius={22} />
      <View style={{ gap: 8 }}>
        <SkeletonBlock height={40} width={96} borderRadius={14} />
        <SkeletonBlock height={14} width={120} borderRadius={10} />
      </View>
    </View>
  );
}

export function CurrentWeatherCard({ location }: CurrentWeatherCardProps) {
  const theme = useAppTheme();
  const [weather, setWeather] = useState<CurrentWeatherSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWeather = useEffectEvent(async (signal?: AbortSignal) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const snapshot = await fetchCurrentWeather({
        location,
        signal,
      });
      setWeather(snapshot);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      setWeather(null);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load current weather.');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    const controller = new AbortController();

    setWeather(null);
    setErrorMessage(null);
    setIsLoading(true);
    void loadWeather(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadWeather, location]);

  const visualKind = weather ? getWeatherVisualKind(weather.weatherCode) : 'partly-cloudy';
  const accentTint =
    visualKind === 'storm'
      ? 'rgba(255, 191, 71, 0.12)'
      : visualKind === 'rain' || visualKind === 'snow'
        ? 'rgba(118, 168, 255, 0.12)'
        : 'rgba(201, 255, 69, 0.12)';

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 24,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingHorizontal: 16,
        paddingVertical: 14,
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -20,
          right: -8,
          height: 96,
          width: 96,
          borderRadius: 999,
          backgroundColor: accentTint,
        }}
      />

      {isLoading ? (
        <WeatherCardSkeleton />
      ) : errorMessage ? (
        <Text
          selectable
          style={{
            color: theme.textMuted,
            fontSize: 13,
            fontFamily: fontFamilies.bodyStrong,
          }}
        >
          Weather unavailable
        </Text>
      ) : weather ? (
        <>
          <AnimatedWeatherIcon weatherCode={weather.weatherCode} isDay={weather.isDay} size={76} />
          <View style={{ gap: 4 }}>
            <Text
              selectable
              style={{
                color: theme.textOnDark,
                fontSize: 36,
                fontFamily: fontFamilies.display,
                fontVariant: ['tabular-nums'],
              }}
            >
              {`${Math.round(weather.temperatureC)}\u00B0C`}
            </Text>
            <Text
              selectable
              numberOfLines={1}
              style={{
                maxWidth: 180,
                color: theme.textMuted,
                fontSize: 13,
                fontFamily: fontFamilies.bodyStrong,
              }}
            >
              {weather.resolvedLocation}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
