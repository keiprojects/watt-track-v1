import type { BillingCycleOverride } from '@/types/billing';
import type { SystemCost } from '@/types/cost';

export function sortCostsDescending(costs: SystemCost[]): SystemCost[] {
  return [...costs].sort((left, right) => right.date.localeCompare(left.date));
}

export function sortBillingCycleOverridesDescending(overrides: BillingCycleOverride[]): BillingCycleOverride[] {
  return [...overrides].sort((left, right) => right.anchorCycleStartDate.localeCompare(left.anchorCycleStartDate));
}
