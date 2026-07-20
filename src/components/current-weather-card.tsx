import { useEffect, useEffectEvent, useState } from 'react';
import { Text, View } from 'react-native';

import { SkeletonBlock } from '@/components/app-ui';
import { AnimatedWeatherIcon, getWeatherVisualKind } from '@/components/weather-icon';
import { fetchCurrentWeather, type CurrentWeatherSnapshot } from '@/services/weather.service';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type CurrentWeatherCardProps = {
  location?: string;
  variant?: 'default' | 'compact';
};

function WeatherCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <SkeletonBlock height={36} width={36} borderRadius={14} />
        <SkeletonBlock height={22} width={46} borderRadius={9} />
      </View>
    );
  }

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

export function CurrentWeatherCard({ location, variant = 'default' }: CurrentWeatherCardProps) {
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
      if (!signal?.aborted) {
        setIsLoading(false);
      }
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
  }, [location]);

  const visualKind = weather ? getWeatherVisualKind(weather.weatherCode) : 'partly-cloudy';
  const accentTint =
    visualKind === 'storm'
      ? 'rgba(255, 191, 71, 0.12)'
      : visualKind === 'rain' || visualKind === 'snow'
        ? 'rgba(118, 168, 255, 0.12)'
        : theme.mode === 'dark'
          ? 'rgba(214, 255, 77, 0.12)'
          : 'rgba(255, 191, 55, 0.14)';

  if (variant === 'compact') {
    return (
      <View
        style={{
          minHeight: 58,
          minWidth: 104,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: 20,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surface,
          paddingHorizontal: 12,
          paddingVertical: 9,
          boxShadow: theme.mode === 'dark' ? '0 12px 28px rgba(0, 0, 0, 0.20)' : '0 12px 28px rgba(7, 14, 28, 0.07)',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -26,
            right: -22,
            height: 86,
            width: 86,
            borderRadius: 999,
            backgroundColor: accentTint,
          }}
        />

        {isLoading ? (
          <WeatherCardSkeleton compact />
        ) : weather ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <AnimatedWeatherIcon weatherCode={weather.weatherCode} isDay={weather.isDay} size={38} />
            <Text
              selectable
              style={{
                color: theme.text,
                fontSize: 18,
                fontFamily: fontFamilies.bodyHeavy,
                fontVariant: ['tabular-nums'],
              }}
            >
              {`${Math.round(weather.temperatureC)}\u00B0C`}
            </Text>
          </View>
        ) : (
          <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
            {errorMessage ? 'Weather --' : '--\u00B0C'}
          </Text>
        )}
      </View>
    );
  }

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
        borderColor: theme.border,
        backgroundColor: theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        overflow: 'hidden',
        boxShadow: theme.mode === 'dark' ? '0 16px 34px rgba(0, 0, 0, 0.20)' : theme.shadow,
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
                color: theme.text,
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
