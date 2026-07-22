import { Text, View } from 'react-native';

import { SkeletonBlock } from '@/components/app-ui';
import { AnimatedWeatherIcon, getWeatherVisualKind } from '@/components/weather-icon';
import type { CurrentWeatherSnapshot } from '@/services/weather.service';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type CurrentWeatherCardProps = {
  weather: CurrentWeatherSnapshot | null;
  errorMessage?: string | null;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
};

function WeatherCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <View style={{ alignItems: 'flex-end', gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SkeletonBlock height={26} width={26} borderRadius={13} />
          <SkeletonBlock height={20} width={48} borderRadius={9} />
        </View>
        <SkeletonBlock height={12} width={72} borderRadius={7} />
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

function getCompactLocationLabel(location: string): string {
  return location.split(',')[0]?.trim() || location;
}

export function CurrentWeatherCard({
  weather,
  errorMessage,
  isLoading = false,
  variant = 'default',
}: CurrentWeatherCardProps) {
  const theme = useAppTheme();
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
          minHeight: 54,
          minWidth: 94,
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 2,
          paddingTop: 2,
        }}
      >
        {isLoading ? (
          <WeatherCardSkeleton compact />
        ) : weather ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
              <AnimatedWeatherIcon weatherCode={weather.weatherCode} isDay={weather.isDay} size={30} />
              <Text
                selectable
                style={{
                  color: theme.text,
                  fontSize: 18,
                  fontFamily: fontFamilies.bodyHeavy,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`${Math.round(weather.temperatureC)}°C`}
              </Text>
            </View>
            <Text
              selectable
              numberOfLines={1}
              style={{
                maxWidth: 112,
                color: theme.textMuted,
                fontSize: 13,
                fontFamily: fontFamilies.body,
              }}
            >
              {getCompactLocationLabel(weather.resolvedLocation)}
            </Text>
          </>
        ) : (
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontFamily: fontFamilies.bodyHeavy }}>
              {errorMessage ? '--' : '--°C'}
            </Text>
            <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
              Weather
            </Text>
          </View>
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
        style={{
          pointerEvents: 'none',
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
              {`${Math.round(weather.temperatureC)}°C`}
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
