import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { DateTimePickerField } from '@/components/date-time-picker-field';
import {
  IconSquare,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  SoftCard,
  wattGradients,
  type WattIconName,
} from '@/components/watt-ui';
import { buildReadingPreview, findPreviousReadings } from '@/services/calculation.service';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { EnergyReading, ReadingDraft } from '@/types/reading';
import type { SystemProfile } from '@/types/system';
import { formatShortDate, getTodayDateInputValue, isValidDateInputValue, isValidTimeInputValue } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';
import { getWarningLabel } from '@/utils/readingWarnings';

const optionalNumberField = z.preprocess(
  (value) => (value === '' || value === null || typeof value === 'undefined' ? undefined : value),
  z.coerce.number().min(0, 'Value cannot be negative').optional(),
);

const readingSchema = z
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

type ReadingFormValues = z.infer<typeof readingSchema>;

type ReadingFormProps = {
  title: string;
  description: string;
  systemProfile: SystemProfile | null;
  readings: EnergyReading[];
  initialDraft?: Partial<ReadingDraft>;
  duplicateDateIgnoreId?: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  onSubmitDraft: (draft: ReadingDraft, options: { stayOnForm: boolean }) => Promise<void>;
  onCancel?: () => void;
};

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || typeof value === 'undefined') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildFormValues(systemProfile: SystemProfile, initialDraft?: Partial<ReadingDraft>): ReadingFormValues {
  return {
    date: initialDraft?.date ?? getTodayDateInputValue(),
    time: initialDraft?.time ?? '',
    gridReading: initialDraft?.gridReading,
    solarReading: initialDraft?.solarReading,
    exportReading: initialDraft?.exportReading,
    importRate: initialDraft?.importRate ?? systemProfile.defaultImportRate,
    exportRate: initialDraft?.exportRate ?? systemProfile.defaultExportRate,
    notes: initialDraft?.notes ?? '',
    meterReset: initialDraft?.meterReset ?? false,
  };
}

function normalizeTimeSlot(time?: string): string {
  return time?.trim() || '__end_of_day__';
}

function FieldError({ message }: { message?: string }) {
  const theme = useAppTheme();

  if (!message) {
    return null;
  }

  return <Text style={{ color: theme.dangerText, fontSize: 12, fontFamily: fontFamilies.body }}>{message}</Text>;
}

function UnitInput({
  icon,
  label,
  value,
  onChangeText,
  unit = 'kWh',
  placeholder = '0',
  error,
}: {
  icon: WattIconName;
  label: string;
  value: unknown;
  onChangeText: (value: string) => void;
  unit?: string;
  placeholder?: string;
  error?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          minHeight: 62,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 14,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: error ? theme.dangerText : theme.border,
          backgroundColor: theme.surface,
          paddingHorizontal: 12,
        }}
      >
        <View
          style={{
            height: 34,
            width: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: theme.accentSoft,
          }}
        >
          <Ionicons name={icon} size={19} color={theme.accent} />
        </View>
        <Text numberOfLines={2} style={{ flex: 1, minWidth: 0, color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
          {label}
        </Text>
        <TextInput
          value={value == null ? '' : String(value)}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={theme.textSubtle}
          style={{
            width: 86,
            color: theme.text,
            fontSize: 16,
            textAlign: 'right',
            fontFamily: fontFamilies.bodyHeavy,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>{unit}</Text>
      </View>
      <FieldError message={error} />
    </View>
  );
}

function FormActionButton({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: primary ? theme.accent : theme.border,
        backgroundColor: primary ? theme.accent : theme.surface,
        opacity: disabled ? 0.55 : pressed ? 0.78 : 1,
      })}
    >
      <Text style={{ color: primary ? '#ffffff' : theme.accent, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ReadingForm({
  title,
  description,
  systemProfile,
  readings,
  initialDraft,
  duplicateDateIgnoreId,
  primaryActionLabel,
  secondaryActionLabel,
  onSubmitDraft,
  onCancel,
}: ReadingFormProps) {
  const theme = useAppTheme();
  const { formatCurrency, formatKwh } = useAppFormatters();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema) as Resolver<ReadingFormValues>,
    defaultValues: systemProfile ? buildFormValues(systemProfile, initialDraft) : undefined,
  });

  useEffect(() => {
    if (systemProfile) {
      reset(buildFormValues(systemProfile, initialDraft));
    }
  }, [initialDraft, reset, systemProfile]);

  const watchedValues = watch();
  const comparisonReadings = useMemo(
    () => readings.filter((reading) => reading.id !== duplicateDateIgnoreId),
    [duplicateDateIgnoreId, readings],
  );

  const draft = useMemo<ReadingDraft | null>(() => {
    if (!systemProfile) {
      return null;
    }

    return {
      date: watchedValues.date,
      time: watchedValues.time || undefined,
      gridReading: parseOptionalNumber(watchedValues.gridReading),
      solarReading: parseOptionalNumber(watchedValues.solarReading),
      exportReading: parseOptionalNumber(watchedValues.exportReading),
      importRate: parseOptionalNumber(watchedValues.importRate),
      exportRate: parseOptionalNumber(watchedValues.exportRate),
      notes: watchedValues.notes,
      meterReset: watchedValues.meterReset,
    };
  }, [systemProfile, watchedValues]);

  const previousReadings = useMemo(() => {
    if (!systemProfile || !draft) {
      return null;
    }

    return findPreviousReadings(comparisonReadings, draft);
  }, [comparisonReadings, draft, systemProfile]);

  const preview = useMemo(() => {
    if (!systemProfile || !draft || !previousReadings) {
      return null;
    }

    return buildReadingPreview({ draft, profile: systemProfile, previousReadings });
  }, [draft, previousReadings, systemProfile]);

  if (!systemProfile) {
    return (
      <ScreenScroll>
        <ScreenHeader title={title} leftIcon="chevron-back" leftLabel="Back" onLeftPress={() => router.push('/onboarding')} />
        <SoftCard>
          <Text style={{ color: theme.text, fontSize: 18, fontFamily: fontFamilies.bodyHeavy }}>Finish setup first</Text>
          <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20, fontFamily: fontFamilies.body }}>
            WattTrack needs your rates, timezone, and reading modes before it can calculate savings.
          </Text>
        </SoftCard>
      </ScreenScroll>
    );
  }

  const hasCumulativeMode =
    systemProfile.gridInputMode === 'cumulative' ||
    systemProfile.solarInputMode === 'cumulative' ||
    systemProfile.exportInputMode === 'cumulative';
  const gridLabel = systemProfile.gridInputMode === 'cumulative' ? 'Grid Meter (Import)' : 'Grid Consumed';
  const solarLabel = systemProfile.solarInputMode === 'cumulative' ? 'Solar Generated (Inverter)' : 'Solar Generated';
  const exportLabel = systemProfile.exportInputMode === 'cumulative' ? 'Export Meter' : 'Exported Energy';

  const submitValues = async (values: ReadingFormValues, stayOnForm: boolean) => {
    const nextDraft: ReadingDraft = {
      date: values.date,
      time: values.time || undefined,
      gridReading: parseOptionalNumber(values.gridReading),
      solarReading: parseOptionalNumber(values.solarReading),
      exportReading: systemProfile.exportInputMode === 'disabled' ? undefined : parseOptionalNumber(values.exportReading),
      importRate: parseOptionalNumber(values.importRate),
      exportRate: parseOptionalNumber(values.exportRate),
      notes: values.notes,
      meterReset: values.meterReset,
    };
    const warnings = preview?.warningCodes ?? [];
    const matchingDateReadings = readings.filter((reading) => reading.date === values.date && reading.id !== duplicateDateIgnoreId);
    const hasDuplicateTimestamp = matchingDateReadings.some(
      (reading) => normalizeTimeSlot(reading.time) === normalizeTimeSlot(values.time),
    );

    if (hasDuplicateTimestamp) {
      Alert.alert(
        'Duplicate reading time',
        values.time
          ? 'A reading for this date and time already exists. Change the time or edit the existing entry instead.'
          : 'A reading without a time already exists for this date. Add a time to save another intra-day entry.',
      );
      return;
    }

    if (warnings.length === 0) {
      await onSubmitDraft(nextDraft, { stayOnForm });
      if (stayOnForm) {
        reset(buildFormValues(systemProfile));
      }
      return;
    }

    Alert.alert('Review warnings', warnings.map(getWarningLabel).join('\n'), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save anyway',
        onPress: () => {
          void onSubmitDraft(nextDraft, { stayOnForm }).then(() => {
            if (stayOnForm) {
              reset(buildFormValues(systemProfile));
            }
          });
        },
      },
    ]);
  };

  const goBack = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    router.push('/(tabs)');
  };

  return (
    <ScreenScroll gap={18}>
      <ScreenHeader title={title} leftIcon="chevron-back" leftLabel="Back" onLeftPress={goBack} />

      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>{description}</Text>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Date & Time" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <DateTimePickerField
                  mode="date"
                  value={value ?? ''}
                  displayValue={value ? formatShortDate(value) : ''}
                  placeholder="Pick date"
                  onChange={onChange}
                  maximumDate={new Date(`${getTodayDateInputValue()}T00:00:00`)}
                />
              )}
            />
            <FieldError message={errors.date?.message} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="time"
              render={({ field: { onChange, value } }) => (
                <DateTimePickerField
                  mode="time"
                  value={value ?? ''}
                  displayValue={value ?? ''}
                  placeholder="Pick time"
                  onChange={onChange}
                  allowClear
                />
              )}
            />
            <FieldError message={errors.time?.message} />
          </View>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Readings" />
        <Controller
          control={control}
          name="gridReading"
          render={({ field: { onChange, value } }) => (
            <UnitInput icon="grid-outline" label={gridLabel} value={value} onChangeText={onChange} error={errors.gridReading?.message} />
          )}
        />
        <Controller
          control={control}
          name="solarReading"
          render={({ field: { onChange, value } }) => (
            <UnitInput icon="sunny-outline" label={solarLabel} value={value} onChangeText={onChange} error={errors.solarReading?.message} />
          )}
        />
        {systemProfile.exportInputMode !== 'disabled' ? (
          <Controller
            control={control}
            name="exportReading"
            render={({ field: { onChange, value } }) => (
              <UnitInput icon="swap-horizontal-outline" label={exportLabel} value={value} onChangeText={onChange} error={errors.exportReading?.message} />
            )}
          />
        ) : null}
      </View>

      {hasCumulativeMode ? (
        <SoftCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>Meter reset or replacement</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>
              Turn this on only when a cumulative meter rolled over or was replaced.
            </Text>
          </View>
          <Controller
            control={control}
            name="meterReset"
            render={({ field: { onChange, value } }) => <Switch value={Boolean(value)} onValueChange={onChange} trackColor={{ true: theme.accent }} />}
          />
        </SoftCard>
      ) : null}

      <View style={{ gap: 10 }}>
        <SectionHeader title="Notes (Optional)" />
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Add a note..."
              placeholderTextColor={theme.textSubtle}
              multiline
              style={{
                minHeight: 104,
                borderRadius: 14,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                padding: 14,
                color: theme.text,
                fontSize: 15,
                fontFamily: fontFamilies.body,
                textAlignVertical: 'top',
              }}
            />
          )}
        />
      </View>

      {preview ? (
        <SoftCard tone="green">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconSquare icon={preview.warningCodes.length ? 'warning' : 'checkmark'} colors={preview.warningCodes.length ? wattGradients.amber : wattGradients.green} size={42} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>
                {preview.warningCodes.length ? 'Review calculated values' : 'Calculated preview'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
                Usage {formatKwh(preview.estimatedHomeUsageKwh)} | Savings {formatCurrency(preview.estimatedSavings)}
              </Text>
            </View>
          </View>
          {preview.warningCodes.length ? (
            <Text style={{ color: theme.warningText, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>
              {preview.warningCodes.map(getWarningLabel).join('\n')}
            </Text>
          ) : null}
        </SoftCard>
      ) : null}

      <View style={{ gap: 10 }}>
        <FormActionButton
          label={isSubmitting ? 'Saving...' : primaryActionLabel}
          primary
          disabled={isSubmitting}
          onPress={() => void handleSubmit((values) => submitValues(values, false))()}
        />
        {secondaryActionLabel ? (
          <FormActionButton
            label={secondaryActionLabel}
            disabled={isSubmitting}
            onPress={() => void handleSubmit((values) => submitValues(values, true))()}
          />
        ) : null}
      </View>
    </ScreenScroll>
  );
}
