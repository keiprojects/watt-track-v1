import { useEffect, useEffectEvent, useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton, SectionTitle, SkeletonBlock } from '@/components/app-ui';
import { AnimatedWeatherIcon, getWeatherLabel, getWeatherVisualKind } from '@/components/weather-icon';
import { fetchCurrentWeather, type CurrentWeatherSnapshot } from '@/services/weather.service';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type CurrentWeatherCardProps = {
  location?: string;
};

function WeatherMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        minWidth: 108,
        flex: 1,
        gap: 4,
        borderRadius: 18,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text
        style={{
          color: theme.textSubtle,
          fontSize: 11,
          fontFamily: fontFamilies.bodyStrong,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.text,
          fontSize: 17,
          fontFamily: fontFamilies.bodyHeavy,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function WeatherCardSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <SkeletonBlock height={88} width={88} borderRadius={24} />
        <View style={{ flex: 1, gap: 10 }}>
          <SkeletonBlock height={18} width="42%" />
          <SkeletonBlock height={40} width="58%" />
          <SkeletonBlock height={16} width="74%" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <SkeletonBlock height={66} width="48%" borderRadius={18} />
        <SkeletonBlock height={66} width="48%" borderRadius={18} />
        <SkeletonBlock height={66} width="48%" borderRadius={18} />
      </View>
    </View>
  );
}

function buildWeatherNote(weather: CurrentWeatherSnapshot): string {
  if (weather.isFallbackLocation) {
    return 'Showing Manila until you save your system location.';
  }

  return `Live conditions for ${weather.resolvedLocation}.`;
}

export function CurrentWeatherCard({ location }: CurrentWeatherCardProps) {
  const theme = useAppTheme();
  const [weather, setWeather] = useState<CurrentWeatherSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWeather = useEffectEvent(async (forceRefresh: boolean, signal?: AbortSignal) => {
    setErrorMessage(null);
    setIsLoading(!forceRefresh);
    setIsRefreshing(forceRefresh);

    try {
      const snapshot = await fetchCurrentWeather({
        location,
        signal,
        forceRefresh,
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
      setIsRefreshing(false);
    }
  });

  useEffect(() => {
    const controller = new AbortController();

    setWeather(null);
    setErrorMessage(null);
    setIsLoading(true);
    void loadWeather(false, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadWeather, location]);

  const weatherLabel = weather ? getWeatherLabel(weather.weatherCode) : 'Current weather';
  const visualKind = weather ? getWeatherVisualKind(weather.weatherCode) : 'partly-cloudy';
  const accentTint =
    visualKind === 'storm'
      ? 'rgba(255, 191, 71, 0.12)'
      : visualKind === 'rain' || visualKind === 'snow'
        ? 'rgba(118, 168, 255, 0.12)'
        : theme.accentSoft;

  return (
    <View
      style={{
        gap: 16,
        borderRadius: 24,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surfaceRaised,
        padding: 16,
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -36,
          right: -12,
          height: 136,
          width: 136,
          borderRadius: 999,
          backgroundColor: accentTint,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -46,
          left: -22,
          height: 118,
          width: 118,
          borderRadius: 999,
          backgroundColor: 'rgba(104, 162, 255, 0.08)',
        }}
      />

      <SectionTitle
        title="Current weather"
        description="Live sky context for the reading you are about to save."
        icon="cloud-outline"
        eyebrow="Now"
        action={
          <AppButton
            label={isRefreshing ? 'Refreshing' : 'Refresh'}
            icon="refresh-outline"
            tone="ghost"
            fullWidth={false}
            disabled={isLoading || isRefreshing}
            onPress={() => void loadWeather(true)}
          />
        }
      />

      {isLoading ? (
        <WeatherCardSkeleton />
      ) : errorMessage ? (
        <View
          style={{
            gap: 10,
            borderRadius: 18,
            borderCurve: 'continuous',
            backgroundColor: theme.warningSoft,
            padding: 14,
          }}
        >
          <Text
            style={{
              color: theme.warningText,
              fontSize: 15,
              fontFamily: fontFamilies.bodyStrong,
            }}
          >
            Weather unavailable
          </Text>
          <Text
            style={{
              color: theme.warningText,
              fontSize: 13,
              lineHeight: 18,
              fontFamily: fontFamilies.body,
            }}
          >
            {errorMessage}
          </Text>
        </View>
      ) : weather ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <AnimatedWeatherIcon weatherCode={weather.weatherCode} isDay={weather.isDay} size={92} />

            <View style={{ flex: 1, gap: 6 }}>
              <Text
                style={{
                  color: theme.textSubtle,
                  fontSize: 12,
                  fontFamily: fontFamilies.bodyStrong,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {weather.resolvedLocation}
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: 42,
                  fontFamily: fontFamilies.display,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {Math.round(weather.temperatureC)}°C
              </Text>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 16,
                  fontFamily: fontFamilies.bodyStrong,
                }}
              >
                {weatherLabel}
              </Text>
              <Text
                style={{
                  color: theme.textSubtle,
                  fontSize: 13,
                  lineHeight: 18,
                  fontFamily: fontFamilies.body,
                }}
              >
                {buildWeatherNote(weather)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <WeatherMetric label="Feels like" value={`${Math.round(weather.feelsLikeC)}°C`} />
            <WeatherMetric label="Humidity" value={`${Math.round(weather.humidityPercent)}%`} />
            <WeatherMetric label="Wind" value={`${Math.round(weather.windSpeedKph)} km/h`} />
            <WeatherMetric label="Rain" value={`${weather.precipitationMm.toFixed(1)} mm`} />
          </View>

          {weather.isFallbackLocation ? (
            <Text
              style={{
                color: theme.textSubtle,
                fontSize: 12,
                lineHeight: 18,
                fontFamily: fontFamilies.body,
              }}
            >
              Add your site location in Profile details for weather that matches your system instead of the Manila fallback.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
