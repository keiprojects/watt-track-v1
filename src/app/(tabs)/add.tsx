import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { MetricCard } from '@/components/metric-card';
import { buildReadingPreview, createReadingRecord, findPreviousReading } from '@/services/calculation.service';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import type { ReadingDraft } from '@/types/reading';
import { getTodayDateInputValue } from '@/utils/date';
import { formatCurrency, formatKwh } from '@/utils/format';
import { createId } from '@/utils/ids';

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
  gridReading: z.coerce.number().min(0, 'Grid value cannot be negative'),
  solarReading: z.coerce.number().min(0, 'Solar value cannot be negative'),
  exportReading: optionalNumberField,
  importRate: optionalNumberField,
  exportRate: optionalNumberField,
  notes: z.string().optional(),
  meterReset: z.boolean().optional(),
});

type ReadingFormValues = z.infer<typeof readingSchema>;

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || typeof value === 'undefined') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getWarningLabel(warning: string): string {
  const warningLabels: Record<string, string> = {
    'cumulative-lower-than-prior': 'A cumulative reading is lower than the previous value. Review it or mark a meter reset.',
    'unusually-high-solar': 'Solar generation looks unusually high for the configured array size.',
    'export-higher-than-solar': 'Exported energy is higher than solar generation.',
    'zero-electricity-rate': 'Import rate is zero, so savings may be understated.',
  };

  return warningLabels[warning] ?? warning;
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

export default function AddReadingScreen() {
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const readings = useReadingsStore((state) => state.readings);
  const saveReading = useReadingsStore((state) => state.saveReading);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema) as Resolver<ReadingFormValues>,
    defaultValues: {
      date: getTodayDateInputValue(),
      time: '',
      gridReading: 0,
      solarReading: 0,
      exportReading: undefined,
      importRate: systemProfile?.defaultImportRate,
      exportRate: systemProfile?.defaultExportRate,
      notes: '',
      meterReset: false,
    },
  });

  const watchedValues = watch();

  const preview = useMemo(() => {
    if (!systemProfile) {
      return null;
    }

    const draft: ReadingDraft = {
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
    const previousReading = findPreviousReading(readings, draft);

    return buildReadingPreview({ draft, profile: systemProfile, previousReading });
  }, [readings, systemProfile, watchedValues]);

  if (!systemProfile) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: '#f8fafc' }}
        contentContainerStyle={{ gap: 16, padding: 20 }}
      >
        <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>Add reading</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          Finish onboarding first so WattTrack knows your rates, timezone, and reading modes.
        </Text>
      </ScrollView>
    );
  }

  const gridLabel = systemProfile.gridInputMode === 'cumulative' ? 'Grid meter reading' : 'Grid usage (kWh)';
  const solarLabel = systemProfile.solarInputMode === 'cumulative' ? 'Solar meter reading' : 'Solar generation (kWh)';
  const exportLabel = systemProfile.exportInputMode === 'cumulative' ? 'Export meter reading' : 'Exported energy (kWh)';

  const persistReading = async (values: ReadingFormValues, stayOnForm: boolean) => {
    if (readings.some((reading) => reading.date === values.date)) {
      Alert.alert('Duplicate date', 'WattTrack currently supports one primary reading per date. Edit the existing entry instead.');
      return;
    }

    const draft: ReadingDraft = {
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
    const previousReading = findPreviousReading(readings, draft);
    const createdAt = new Date().toISOString();
    const reading = createReadingRecord({
      draft,
      profile: systemProfile,
      previousReading,
      id: createId('reading'),
      createdAt,
    });

    await saveReading(reading);

    if (stayOnForm) {
      reset({
        date: getTodayDateInputValue(),
        time: '',
        gridReading: 0,
        solarReading: 0,
        exportReading: undefined,
        importRate: systemProfile.defaultImportRate,
        exportRate: systemProfile.defaultExportRate,
        notes: '',
        meterReset: false,
      });
      Alert.alert('Reading saved', 'You can add another reading now.');
      return;
    }

    Alert.alert('Reading saved', 'Your dashboard and insights have been updated.');
    router.replace('/(tabs)');
  };

  const onSubmit = async (values: ReadingFormValues, stayOnForm: boolean) => {
    const warnings = preview?.warningCodes ?? [];

    if (warnings.length === 0) {
      await persistReading(values, stayOnForm);
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
            void persistReading(values, stayOnForm);
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
        <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>Add reading</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          Log one daily entry for your system. Derived values below update automatically from your saved setup and prior readings.
        </Text>
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

        <Field label="Time" helper="Optional, use HH:MM" error={errors.time?.message}>
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

        <Field label={gridLabel} error={errors.gridReading?.message}>
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

        <Field label={solarLabel} error={errors.solarReading?.message}>
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
          <Field label={exportLabel} error={errors.exportReading?.message}>
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
          onPress={handleSubmit((values) => onSubmit(values, false))}
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
          <Text style={{ color: '#f0fdfa', fontSize: 16, fontWeight: '800' }}>Save reading</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit((values) => onSubmit(values, true))}
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
          <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Save & add another</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
