import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { MetricCard } from '@/components/metric-card';
import { buildReadingPreview, findPreviousReadings } from '@/services/calculation.service';
import type { EnergyReading, ReadingDraft } from '@/types/reading';
import type { SystemProfile } from '@/types/system';
import { formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';
import { getWarningLabel } from '@/utils/readingWarnings';

const optionalNumberField = z.preprocess(
  (value) => (value === '' || value === null || typeof value === 'undefined' ? undefined : value),
  z.coerce.number().min(0, 'Value cannot be negative').optional(),
);

const readingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  time: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{2}:\d{2}$/.test(value), 'Use HH:MM if adding a time'),
  gridReading: optionalNumberField,
  solarReading: optionalNumberField,
  exportReading: optionalNumberField,
  importRate: optionalNumberField,
  exportRate: optionalNumberField,
  notes: z.string().optional(),
  meterReset: z.boolean().optional(),
}).refine((values) => typeof values.gridReading === 'number' || typeof values.solarReading === 'number' || typeof values.exportReading === 'number', {
  message: 'Enter at least one meter value.',
  path: ['gridReading'],
});

type ReadingFormValues = z.infer<typeof readingSchema>;

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

function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '700' }}>{label}</Text>
      {helper ? <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18 }}>{helper}</Text> : null}
      {children}
      {error ? <Text style={{ color: '#b91c1c', fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

function formatPreviousReadingLabel(reading?: EnergyReading): string | undefined {
  if (!reading) {
    return undefined;
  }

  return reading.time ? `${formatShortDate(reading.date)} at ${reading.time}` : formatShortDate(reading.date);
}

function normalizeTimeSlot(time?: string): string {
  return time?.trim() || '__end_of_day__';
}

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
    if (!systemProfile) {
      return;
    }

    reset(buildFormValues(systemProfile, initialDraft));
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
  const sameDateReadings = useMemo(
    () => (draft?.date ? comparisonReadings.filter((reading) => reading.date === draft.date) : []),
    [comparisonReadings, draft?.date],
  );

  if (!systemProfile) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: '#f8fafc' }}
        contentContainerStyle={{ gap: 16, padding: 20 }}
      >
        <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          Finish onboarding first so WattTrack knows your rates, timezone, and reading modes.
        </Text>
      </ScrollView>
    );
  }

  const gridLabel = systemProfile.gridInputMode === 'cumulative' ? 'Grid meter reading' : 'Grid usage (kWh)';
  const solarLabel = systemProfile.solarInputMode === 'cumulative' ? 'Solar meter reading' : 'Solar generation (kWh)';
  const exportLabel = systemProfile.exportInputMode === 'cumulative' ? 'Export meter reading' : 'Exported energy (kWh)';
  const previousGridReadingLabel = formatPreviousReadingLabel(previousReadings?.grid);
  const gridHelper =
    systemProfile.gridInputMode === 'cumulative'
      ? previousGridReadingLabel
        ? `Enter the meter-base number you see now. WattTrack will subtract the previous grid reading from ${previousGridReadingLabel}.`
        : 'Optional. Enter the meter-base number you see now. The first cumulative entry sets your baseline, so daily grid usage starts on the next reading.'
      : 'Enter the kWh you used since your last reading.';
  const solarHelper =
    systemProfile.solarInputMode === 'cumulative'
      ? 'Optional. Enter the solar meter number you see now. You can record one reading when PV starts and another when PV stops for the day.'
      : 'Enter the kWh your system generated since your last reading.';
  const exportHelper =
    systemProfile.exportInputMode === 'cumulative'
      ? 'Enter the export meter number you see now.'
      : 'Enter the kWh exported since your last reading.';

  const submitValues = async (values: ReadingFormValues, stayOnForm: boolean) => {
    const nextDraft: ReadingDraft = {
      date: values.date,
      time: values.time || undefined,
      gridReading: values.gridReading,
      solarReading: values.solarReading,
      exportReading: systemProfile.exportInputMode === 'disabled' ? undefined : values.exportReading,
      importRate: values.importRate,
      exportRate: values.exportRate,
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

    Alert.alert(
      'Review warnings',
      warnings.map(getWarningLabel).join('\n'),
      [
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
      ],
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>{description}</Text>
      </View>

      <View
        style={{
          gap: 18,
          borderRadius: 8,
          borderCurve: 'continuous',
          backgroundColor: '#ffffff',
          padding: 18,
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Field label="Date" helper="Use YYYY-MM-DD" error={errors.date?.message}>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                style={{
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: 14,
                }}
              />
            )}
          />
        </Field>

        <Field
          label="Time"
          helper={
            sameDateReadings.length > 0
              ? 'Use HH:MM. Add a time when saving multiple readings on the same date.'
              : 'Optional, use HH:MM'
          }
          error={errors.time?.message}
        >
          <Controller
            control={control}
            name="time"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="18:30"
                style={{
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: 14,
                }}
              />
            )}
          />
        </Field>

        <Field label={gridLabel} helper={gridHelper} error={errors.gridReading?.message}>
          <Controller
            control={control}
            name="gridReading"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="numeric"
                style={{
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: 14,
                }}
              />
            )}
          />
        </Field>

        <Field label={solarLabel} helper={solarHelper} error={errors.solarReading?.message}>
          <Controller
            control={control}
            name="solarReading"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="numeric"
                style={{
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: 14,
                }}
              />
            )}
          />
        </Field>

        {systemProfile.exportInputMode !== 'disabled' ? (
          <Field label={exportLabel} helper={exportHelper} error={errors.exportReading?.message}>
            <Controller
              control={control}
              name="exportReading"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={typeof value === 'number' ? String(value) : ''}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  style={{
                    borderRadius: 8,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: 14,
                  }}
                />
              )}
            />
          </Field>
        ) : null}

        <Field label="Import rate override" helper="Optional" error={errors.importRate?.message}>
          <Controller
            control={control}
            name="importRate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={typeof value === 'number' ? String(value) : ''}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder={String(systemProfile.defaultImportRate)}
                style={{
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: 14,
                }}
              />
            )}
          />
        </Field>

        {systemProfile.exportInputMode !== 'disabled' ? (
          <Field label="Export rate override" helper="Optional" error={errors.exportRate?.message}>
            <Controller
              control={control}
              name="exportRate"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={typeof value === 'number' ? String(value) : ''}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  placeholder={String(systemProfile.defaultExportRate ?? '')}
                  style={{
                    borderRadius: 8,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: 14,
                  }}
                />
              )}
            />
          </Field>
        ) : null}

        <Field label="Notes" helper="Optional" error={errors.notes?.message}>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Cloudy day, maintenance, outage..."
                multiline
                style={{
                  minHeight: 92,
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  backgroundColor: '#ffffff',
                  padding: 14,
                  textAlignVertical: 'top',
                }}
              />
            )}
          />
        </Field>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#f8fafc',
            padding: 14,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: '#0f172a', fontSize: 15, fontWeight: '700' }}>Meter reset or replacement</Text>
            <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18 }}>
              Turn this on when a cumulative meter has rolled over or been replaced.
            </Text>
          </View>
          <Controller
            control={control}
            name="meterReset"
            render={({ field: { onChange, value } }) => <Switch value={Boolean(value)} onValueChange={onChange} trackColor={{ true: '#0f766e' }} />}
          />
        </View>
      </View>

      {preview ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Preview</Text>
          {systemProfile.gridInputMode === 'cumulative' && typeof draft?.gridReading === 'number' ? (
            <View
              style={{
                gap: 6,
                borderRadius: 8,
                borderCurve: 'continuous',
                backgroundColor: '#eff6ff',
                padding: 14,
              }}
            >
              <Text style={{ color: '#1d4ed8', fontSize: 15, fontWeight: '800' }}>Grid meter check</Text>
              <Text style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 18 }}>
                {previousGridReadingLabel
                  ? `Current reading ${formatKwh(draft.gridReading)} minus previous reading ${formatKwh(previousReadings?.grid?.gridReading ?? 0)} from ${previousGridReadingLabel} equals ${formatKwh(preview.gridConsumptionKwh)} grid usage.`
                  : `This is your baseline grid meter reading. Grid usage will start calculating after you save a later reading.`}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <MetricCard label="Grid consumption" value={formatKwh(preview.gridConsumptionKwh)} />
            <MetricCard label="Solar generation" value={formatKwh(preview.solarGenerationKwh)} tone="accent" />
            <MetricCard label="Self-consumed solar" value={formatKwh(preview.selfConsumedSolarKwh)} />
            <MetricCard label="Home usage" value={formatKwh(preview.estimatedHomeUsageKwh)} />
            <MetricCard label="Estimated savings" value={formatCurrency(preview.estimatedSavings)} helper="Estimated" />
          </View>

          {preview.warningCodes.length > 0 ? (
            <View
              style={{
                gap: 6,
                borderRadius: 8,
                borderCurve: 'continuous',
                backgroundColor: '#fff7ed',
                padding: 14,
              }}
            >
              <Text style={{ color: '#9a3412', fontSize: 15, fontWeight: '800' }}>Warnings</Text>
              {preview.warningCodes.map((warning) => (
                <Text key={warning} style={{ color: '#9a3412', fontSize: 13, lineHeight: 18 }}>
                  {getWarningLabel(warning)}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={handleSubmit((values) => submitValues(values, false))}
          disabled={isSubmitting}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#0f766e',
            padding: 16,
          }}
        >
          <Text style={{ color: '#f0fdfa', fontSize: 16, fontWeight: '800' }}>{primaryActionLabel}</Text>
        </Pressable>

        {secondaryActionLabel ? (
          <Pressable
            onPress={handleSubmit((values) => submitValues(values, true))}
            disabled={isSubmitting}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              borderCurve: 'continuous',
              backgroundColor: '#e2e8f0',
              padding: 16,
            }}
          >
            <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>{secondaryActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {onCancel ? (
        <Pressable
          onPress={onCancel}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#ffffff',
            padding: 16,
          }}
        >
          <Text style={{ color: '#334155', fontSize: 15, fontWeight: '700' }}>Cancel</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
