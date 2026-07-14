export function formatCurrency(amount: number, currency = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatKwh(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} kWh`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
