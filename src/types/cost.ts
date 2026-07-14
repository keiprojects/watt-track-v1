export type CostSettings = {
  currencyCode: string;
  ratePerKwh: number;
};

export type CostEstimate = {
  kwh: number;
  amount: number;
  currencyCode: string;
};
