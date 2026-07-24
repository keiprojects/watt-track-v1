import { z } from 'zod';

import { getTodayDateInputValue, isValidDateInputValue, isValidTimeInputValue } from '@/utils/date';

const optionalNumberField = z.preprocess(
  (value) => (value === '' || value === null || typeof value === 'undefined' ? undefined : value),
  z.coerce.number().min(0, 'Value cannot be negative').optional(),
);

export const readingSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .refine(isValidDateInputValue, 'Use a real calendar date')
      .refine((value) => value <= getTodayDateInputValue(), 'Reading date cannot be in the future'),
    time: z
      .string()
      .optional()
      .refine((value) => !value || isValidTimeInputValue(value), 'Use HH:MM if adding a time'),
    gridReading: optionalNumberField,
    solarReading: optionalNumberField,
    exportReading: optionalNumberField,
    importRate: optionalNumberField,
    exportRate: optionalNumberField,
    notes: z.string().optional(),
    meterReset: z.boolean().optional(),
  })
  .refine(
    (values) =>
      typeof values.gridReading === 'number' ||
      typeof values.solarReading === 'number' ||
      typeof values.exportReading === 'number',
    {
      message: 'Enter at least one meter value.',
      path: ['gridReading'],
    },
  );

export type ReadingFormValues = z.infer<typeof readingSchema>;
