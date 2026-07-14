import type { WarningCode } from '@/types/reading';

export function getWarningLabel(warning: WarningCode): string {
  const warningLabels: Record<WarningCode, string> = {
    'cumulative-lower-than-prior': 'A cumulative reading is lower than the previous value. Review it or mark a meter reset.',
    'unusually-high-solar': 'Solar generation looks unusually high for the configured array size.',
    'export-higher-than-solar': 'Exported energy is higher than solar generation.',
    'zero-electricity-rate': 'Import rate is zero, so savings may be understated.',
  };

  return warningLabels[warning];
}
