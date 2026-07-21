import { useEffect, useState } from 'react';

import { fetchCurrentWeather, type CurrentWeatherSnapshot } from '@/services/weather.service';

type CurrentWeatherState = {
  weather: CurrentWeatherSnapshot | null;
  errorMessage: string | null;
  isLoading: boolean;
};

type CurrentWeatherInput = {
  location?: string;
  latitude?: number;
  longitude?: number;
};

export function useCurrentWeather(input?: CurrentWeatherInput): CurrentWeatherState {
  const [weather, setWeather] = useState<CurrentWeatherSnapshot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = input?.location;
  const latitude = input?.latitude;
  const longitude = input?.longitude;

  useEffect(() => {
    const controller = new AbortController();

    setWeather(null);
    setErrorMessage(null);
    setIsLoading(true);

    async function loadWeather() {
      try {
        const snapshot = await fetchCurrentWeather({
          location,
          latitude,
          longitude,
          signal: controller.signal,
        });
        setWeather(snapshot);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setWeather(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load current weather.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadWeather();

    return () => {
      controller.abort();
    };
  }, [location, latitude, longitude]);

  return { weather, errorMessage, isLoading };
}
