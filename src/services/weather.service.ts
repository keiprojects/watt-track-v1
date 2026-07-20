const DEFAULT_WEATHER_LOCATION = 'Manila';
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const WEATHER_REQUEST_TIMEOUT_MS = 6 * 1000;

type GeocodingResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type ForecastResponse = {
  timezone?: string;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
};

export type CurrentWeatherSnapshot = {
  resolvedLocation: string;
  searchLocation: string;
  isFallbackLocation: boolean;
  observedAt: string;
  timezone: string;
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  precipitationMm: number;
  weatherCode: number;
  windSpeedKph: number;
  isDay: boolean;
};

type WeatherCacheEntry = {
  timestamp: number;
  data: CurrentWeatherSnapshot;
};

type FetchCurrentWeatherOptions = {
  location?: string;
  signal?: AbortSignal;
  forceRefresh?: boolean;
};

const weatherCache = new Map<string, WeatherCacheEntry>();

class WeatherServiceError extends Error {}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const requestController = new AbortController();
  let didTimeOut = false;

  const abortRequest = () => {
    requestController.abort();
  };

  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener('abort', abortRequest, { once: true });
  }

  const timeoutId = setTimeout(() => {
    didTimeOut = true;
    requestController.abort();
  }, WEATHER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: requestController.signal });

    if (!response.ok) {
      throw new WeatherServiceError(`Weather service returned HTTP ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (didTimeOut && !signal?.aborted) {
      throw new WeatherServiceError('Weather request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortRequest);
  }
}

function buildResolvedLocation(result: GeocodingResult): string {
  return [result.name, result.admin1, result.country].filter(Boolean).join(', ');
}

export async function fetchCurrentWeather({
  location,
  signal,
  forceRefresh = false,
}: FetchCurrentWeatherOptions): Promise<CurrentWeatherSnapshot> {
  const normalizedLocation = location?.trim();
  const searchLocation = normalizedLocation || DEFAULT_WEATHER_LOCATION;
  const cacheKey = searchLocation.toLowerCase();
  const cached = weatherCache.get(cacheKey);

  if (cached && !forceRefresh && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const geocodingParams = new URLSearchParams({
      name: searchLocation,
      count: '1',
      language: 'en',
      format: 'json',
    });
    const geocodingResponse = await fetchJson<GeocodingResponse>(
      `https://geocoding-api.open-meteo.com/v1/search?${geocodingParams.toString()}`,
      signal,
    );
    const result = geocodingResponse.results?.[0];

    if (!result) {
      throw new WeatherServiceError(
        normalizedLocation
          ? `We couldn't find live weather for "${normalizedLocation}". Update your saved location to try again.`
          : 'Add a system location to localize the weather feed.',
      );
    }

    const forecastParams = new URLSearchParams({
      latitude: String(result.latitude),
      longitude: String(result.longitude),
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
      timezone: 'auto',
      forecast_days: '1',
    });
    const forecastResponse = await fetchJson<ForecastResponse>(
      `https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`,
      signal,
    );

    if (!forecastResponse.current) {
      throw new WeatherServiceError('Live weather is temporarily unavailable.');
    }

    const snapshot: CurrentWeatherSnapshot = {
      resolvedLocation: buildResolvedLocation(result),
      searchLocation,
      isFallbackLocation: !normalizedLocation,
      observedAt: forecastResponse.current.time,
      timezone: forecastResponse.timezone ?? 'auto',
      temperatureC: forecastResponse.current.temperature_2m,
      feelsLikeC: forecastResponse.current.apparent_temperature,
      humidityPercent: forecastResponse.current.relative_humidity_2m,
      precipitationMm: forecastResponse.current.precipitation,
      weatherCode: forecastResponse.current.weather_code,
      windSpeedKph: forecastResponse.current.wind_speed_10m,
      isDay: forecastResponse.current.is_day === 1,
    };

    weatherCache.set(cacheKey, {
      timestamp: Date.now(),
      data: snapshot,
    });

    return snapshot;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (cached) {
      return cached.data;
    }

    if (error instanceof WeatherServiceError) {
      throw error;
    }

    throw new WeatherServiceError('Weather is unavailable while offline.');
  }
}
