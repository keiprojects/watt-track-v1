import { useMemo } from 'react';

import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';

type CurrencyFormatOptions = {
  currency?: string;
  decimals?: number;
};

function normalizeDecimals(decimals: number, fallback: number): number {
  if (!Number.isFinite(decimals)) {
    return fallback;
  }

  return Math.max(0, Math.min(3, Math.trunc(decimals)));
}

export function formatCurrency(amount: number, currencyOrOptions: string | CurrencyFormatOptions = 'PHP'): string {
  const options = typeof currencyOrOptions === 'string' ? { currency: currencyOrOptions } : currencyOrOptions;
  const decimals = normalizeDecimals(options.decimals ?? 2, 2);

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: options.currency ?? 'PHP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatKwh(value: number, decimals = 2): string {
  return `${value.toFixed(normalizeDecimals(decimals, 2))} kWh`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(normalizeDecimals(decimals, 1))}%`;
}

export function formatCoordinates(latitude?: number, longitude?: number): string | undefined {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return undefined;
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function useAppFormatters() {
  const decimalPlaces = useSettingsStore((state) => state.settings.decimalPlaces);
  const currency = useSystemStore((state) => state.systemProfile?.currency ?? 'PHP');

  return useMemo(
    () => ({
      formatCurrency: (amount: number, options?: Omit<CurrencyFormatOptions, 'currency'>) =>
        formatCurrency(amount, {
          currency,
          decimals: options?.decimals ?? decimalPlaces,
        }),
      formatKwh: (value: number, decimals = decimalPlaces) => formatKwh(value, decimals),
      formatPercent: (value: number, decimals = decimalPlaces) => formatPercent(value, decimals),
      formatRate: (amount: number, decimals = decimalPlaces) =>
        `${formatCurrency(amount, {
          currency,
          decimals,
        })} / kWh`,
    }),
    [currency, decimalPlaces],
  );
}
