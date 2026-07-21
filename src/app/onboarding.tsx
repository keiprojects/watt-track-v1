import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { DateTimePickerField } from '@/components/date-time-picker-field';
import { SegmentedControl } from '@/components/segmented-control';
import { IconSquare, ScreenHeader, ScreenScroll, SoftCard, wattGradients } from '@/components/watt-ui';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { ExportInputMode, ReadingInputMode } from '@/types/system';
import { formatShortDate, getTodayDateInputValue, isValidDateInputValue } from '@/utils/date';
import { createId } from '@/utils/ids';

const logoMark = require('../../assets/branding/logo-mark.png');

const optionalPositiveNumber = z.preprocess(
  (value) => (value === '' || value === null || typeof value === 'undefined' ? undefined : value),
  z.coerce.number().positive('Must be greater than zero').optional(),
);

const onboardingSchema = z
  .object({
    systemName: z.string().trim().min(1, 'System name is required'),
    location: z.string().trim().optional(),
    installationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
      .refine(isValidDateInputValue, 'Use a real calendar date')
      .refine((value) => value <= getTodayDateInputValue(), 'Installation date cannot be in the future'),
    timezone: z.string().trim().min(1, 'Timezone is required'),
    initialSystemCost: z.coerce.number().min(0, 'Initial system cost cannot be negative'),
    defaultImportRate: z.coerce.number().min(0, 'Import rate cannot be negative'),
    billingCycleStartDay: z.coerce
      .number()
      .int('Billing date must be a whole day of the month')
      .min(1, 'Billing date must be from 1 to 31')
      .max(31, 'Billing date must be from 1 to 31'),
    defaultExportRate: z.preprocess(
      (value) => (value === '' || value === null || typeof value === 'undefined' ? undefined : value),
      z.coerce.number().min(0, 'Export rate cannot be negative').optional(),
    ),
    solarCapacityKw: optionalPositiveNumber,
    inverterCapacityKw: optionalPositiveNumber,
    batteryCapacityKwh: optionalPositiveNumber,
    gridInputMode: z.enum(['daily', 'cumulative'] satisfies ReadingInputMode[]),
    solarInputMode: z.enum(['daily', 'cumulative'] satisfies ReadingInputMode[]),
    exportEnabled: z.boolean(),
    exportInputMode: z.enum(['disabled', 'daily', 'cumulative'] satisfies ExportInputMode[]),
  })
  .superRefine((values, context) => {
    if (values.exportEnabled && values.exportInputMode === 'disabled') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a daily or cumulative export mode when export tracking is enabled',
        path: ['exportInputMode'],
      });
    }

    if (values.exportEnabled && typeof values.defaultExportRate !== 'number') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Export credit rate is required when export tracking is enabled',
        path: ['defaultExportRate'],
      });
    }
  });

type OnboardingFormValues = z.infer<typeof onboardingSchema>;
type WattIconName = ComponentProps<typeof IconSquare>['icon'];

const readingModeOptions: { label: string; value: ReadingInputMode }[] = [
  { label: 'Daily usage', value: 'daily' },
  { label: 'Meter reading', value: 'cumulative' },
];

const exportModeOptions: { label: string; value: ExportInputMode }[] = [
  { label: 'Off', value: 'disabled' },
  { label: 'Daily', value: 'daily' },
  { label: 'Cumulative', value: 'cumulative' },
];

function getDateDisplayValue(date: string): string {
  return isValidDateInputValue(date) ? formatShortDate(date) : date;
}

function inputStyle(theme: ReturnType<typeof useAppTheme>) {
  return {
    minHeight: 50,
    borderRadius: 16,
    borderCurve: 'continuous' as const,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 14,
    fontFamily: fontFamilies.body,
  };
}

function Field({
  label,
  helper,
  children,
  error,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
  error?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>{label}</Text>
      {helper ? <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>{helper}</Text> : null}
      {children}
      {error ? <Text style={{ color: theme.dangerText, fontSize: 13, fontFamily: fontFamilies.body }}>{error}</Text> : null}
    </View>
  );
}

function ProfileHero({ isEditingProfile }: { isEditingProfile: boolean }) {
  const theme = useAppTheme();

  return (
    <SoftCard padding={16} tone="blue" style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            height: 64,
            width: 64,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: 20,
            borderCurve: 'continuous',
            backgroundColor: '#071734',
          }}
        >
          <Image source={logoMark} resizeMode="contain" style={{ width: 58, height: 44 }} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text style={{ color: theme.accent, fontSize: 21, fontFamily: fontFamilies.displayMedium }}>Watt Track</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>Local-first solar profile</Text>
        </View>
      </View>

      <View style={{ gap: 5 }}>
        <Text style={{ color: theme.text, fontSize: 23, lineHeight: 29, fontFamily: fontFamilies.bodyHeavy }}>
          {isEditingProfile ? 'Edit system profile' : 'Set up your system'}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20, fontFamily: fontFamilies.body }}>
          {isEditingProfile
            ? 'Update rates, capacity, billing cycle, and reading modes without leaving the WattTrack style.'
            : 'Add the details WattTrack needs for readings, savings, and ROI.'}
        </Text>
      </View>
    </SoftCard>
  );
}

function FormSection({
  title,
  icon,
  children,
  tone = 'blue',
}: {
  title: string;
  icon: WattIconName;
  children: ReactNode;
  tone?: keyof typeof wattGradients;
}) {
  const theme = useAppTheme();

  return (
    <SoftCard style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSquare icon={icon} size={42} colors={wattGradients[tone]} />
        <Text style={{ flex: 1, color: theme.text, fontSize: 17, fontFamily: fontFamilies.bodyHeavy }}>{title}</Text>
      </View>
      {children}
    </SoftCard>
  );
}

function SubmitButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        borderRadius: 15,
        borderCurve: 'continuous',
        backgroundColor: disabled ? '#9bb7f4' : '#2563eb',
        paddingHorizontal: 16,
        opacity: pressed ? 0.78 : 1,
        boxShadow: '0 12px 24px rgba(37, 99, 235, 0.18)',
      })}
    >
      <Text style={{ color: '#ffffff', fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>{label}</Text>
      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const readings = useReadingsStore((state) => state.readings);
  const saveProfile = useSystemStore((state) => state.saveProfile);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const systemHydrated = useSystemStore((state) => state.hasHydrated);
  const settings = useSettingsStore((state) => state.settings);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingFormValues>,
    defaultValues: {
      systemName: systemProfile?.systemName ?? '',
      location: systemProfile?.location ?? '',
      installationDate: systemProfile?.installationDate ?? getTodayDateInputValue(),
      timezone: systemProfile?.timezone ?? 'Asia/Manila',
      initialSystemCost: systemProfile?.initialSystemCost ?? 0,
      defaultImportRate: systemProfile?.defaultImportRate ?? 0,
      billingCycleStartDay: systemProfile?.billingCycleStartDay ?? 1,
      defaultExportRate: systemProfile?.defaultExportRate,
      solarCapacityKw: systemProfile?.solarCapacityKw,
      inverterCapacityKw: systemProfile?.inverterCapacityKw,
      batteryCapacityKwh: systemProfile?.batteryCapacityKwh,
      gridInputMode: systemProfile?.gridInputMode ?? 'cumulative',
      solarInputMode: systemProfile?.solarInputMode ?? 'cumulative',
      exportEnabled: systemProfile ? systemProfile.exportInputMode !== 'disabled' : false,
      exportInputMode: systemProfile?.exportInputMode ?? 'disabled',
    },
  });

  const exportEnabled = watch('exportEnabled');
  const isEditingProfile = params.mode === 'edit';

  if (!isEditingProfile && settingsHydrated && systemHydrated && settings.onboardingCompleted && systemProfile) {
    return <Redirect href="/(tabs)" />;
  }

  const persistProfile = async (values: OnboardingFormValues) => {
    const nextExportInputMode = values.exportEnabled ? values.exportInputMode : 'disabled';
    const now = new Date().toISOString();

    await saveProfile({
      id: systemProfile?.id ?? createId('system'),
      systemName: values.systemName.trim(),
      location: values.location?.trim() || undefined,
      installationDate: values.installationDate,
      currency: 'PHP',
      timezone: values.timezone.trim(),
      solarCapacityKw: values.solarCapacityKw,
      inverterCapacityKw: values.inverterCapacityKw,
      batteryCapacityKwh: values.batteryCapacityKwh,
      initialSystemCost: values.initialSystemCost,
      defaultImportRate: values.defaultImportRate,
      billingCycleStartDay: values.billingCycleStartDay,
      defaultExportRate: values.exportEnabled ? values.defaultExportRate : undefined,
      gridInputMode: values.gridInputMode,
      solarInputMode: values.solarInputMode,
      exportInputMode: nextExportInputMode,
      createdAt: systemProfile?.createdAt ?? now,
      updatedAt: now,
    });

    await completeOnboarding();
    router.replace(isEditingProfile ? '/(tabs)/settings' : '/(tabs)');
  };

  const onSubmit = async (values: OnboardingFormValues) => {
    const nextExportInputMode = values.exportEnabled ? values.exportInputMode : 'disabled';
    const changedInputModes =
      systemProfile &&
      (systemProfile.gridInputMode !== values.gridInputMode ||
        systemProfile.solarInputMode !== values.solarInputMode ||
        systemProfile.exportInputMode !== nextExportInputMode);

    if (changedInputModes && readings.length > 0) {
      Alert.alert(
        'Recalculate existing readings?',
        'WattTrack will reinterpret your saved values using the new reading modes and recalculate your history. Continue only if your past entries were recorded in the same style you are switching to now.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Recalculate',
            onPress: () => {
              void persistProfile(values);
            },
          },
        ],
      );
      return;
    }

    await persistProfile(values);
  };

  return (
    <ScreenScroll gap={16} bottomPadding={44}>
      <ScreenHeader
        title={isEditingProfile ? 'System Profile' : 'Setup'}
        leftIcon={isEditingProfile ? 'chevron-back' : undefined}
        leftLabel="Back"
        onLeftPress={() => router.replace('/(tabs)/settings')}
      />

      <ProfileHero isEditingProfile={isEditingProfile} />

      <FormSection title="System Profile" icon="home" tone="blue">
        <Field label="System name" error={errors.systemName?.message}>
          <Controller
            control={control}
            name="systemName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Rooftop solar"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Location" helper="Optional" error={errors.location?.message}>
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Davao City"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Installation date" error={errors.installationDate?.message}>
          <Controller
            control={control}
            name="installationDate"
            render={({ field: { onChange, value } }) => (
              <DateTimePickerField
                mode="date"
                value={value}
                displayValue={getDateDisplayValue(value)}
                placeholder="Pick installation date"
                maximumDate={new Date()}
                onChange={onChange}
              />
            )}
          />
        </Field>

        <Field label="Timezone" error={errors.timezone?.message}>
          <Controller
            control={control}
            name="timezone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                placeholder="Asia/Manila"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <View
          style={{
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: theme.surfaceMuted,
            padding: 14,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>Currency</Text>
          <Text selectable style={{ color: theme.textMuted, marginTop: 4, fontSize: 13, fontFamily: fontFamilies.body }}>
            PHP
          </Text>
        </View>
      </FormSection>

      <FormSection title="Rates & Billing" icon="cash" tone="green">
        <Field label="Initial system cost" error={errors.initialSystemCost?.message}>
          <Controller
            control={control}
            name="initialSystemCost"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Default import rate" helper="Grid electricity rate per kWh." error={errors.defaultImportRate?.message}>
          <Controller
            control={control}
            name="defaultImportRate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field
          label="Billing cycle start day"
          helper="Day of the month your utility billing period starts."
          error={errors.billingCycleStartDay?.message}
        >
          <Controller
            control={control}
            name="billingCycleStartDay"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="number-pad"
                placeholder="1"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>
      </FormSection>

      <FormSection title="System Capacity" icon="battery-charging" tone="amber">
        <Field label="Solar capacity" helper="Optional, in kW." error={errors.solarCapacityKw?.message}>
          <Controller
            control={control}
            name="solarCapacityKw"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Optional"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Inverter capacity" helper="Optional, in kW." error={errors.inverterCapacityKw?.message}>
          <Controller
            control={control}
            name="inverterCapacityKw"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Optional"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Battery capacity" helper="Optional, in kWh." error={errors.batteryCapacityKwh?.message}>
          <Controller
            control={control}
            name="batteryCapacityKwh"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Optional"
                style={inputStyle(theme)}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>
      </FormSection>

      <FormSection title="Reading Modes" icon="analytics" tone="violet">
        <Field
          label="Grid input mode"
          helper="Choose Daily usage if you type kWh directly, or Meter reading if you type the running meter value."
          error={errors.gridInputMode?.message}
        >
          <Controller
            control={control}
            name="gridInputMode"
            render={({ field: { onChange, value } }) => <SegmentedControl options={readingModeOptions} value={value} onChange={onChange} />}
          />
        </Field>

        <Field
          label="Solar input mode"
          helper="Use Meter reading if WattTrack should subtract the previous inverter total."
          error={errors.solarInputMode?.message}
        >
          <Controller
            control={control}
            name="solarInputMode"
            render={({ field: { onChange, value } }) => <SegmentedControl options={readingModeOptions} value={value} onChange={onChange} />}
          />
        </Field>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderRadius: 16,
            borderCurve: 'continuous',
            backgroundColor: theme.surfaceMuted,
            padding: 14,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>Track exported energy</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>
              Include export credits in savings calculations.
            </Text>
          </View>
          <Controller
            control={control}
            name="exportEnabled"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: theme.ringTrack, true: theme.accentSoft }}
                thumbColor={value ? theme.accent : theme.surface}
              />
            )}
          />
        </View>

        {exportEnabled ? (
          <>
            <Field label="Export input mode" error={errors.exportInputMode?.message}>
              <Controller
                control={control}
                name="exportInputMode"
                render={({ field: { onChange, value } }) => <SegmentedControl options={exportModeOptions} value={value} onChange={onChange} />}
              />
            </Field>

            <Field label="Default export credit rate" error={errors.defaultExportRate?.message}>
              <Controller
                control={control}
                name="defaultExportRate"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={typeof value === 'number' ? String(value) : ''}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="0"
                    style={inputStyle(theme)}
                    placeholderTextColor={theme.textSubtle}
                  />
                )}
              />
            </Field>
          </>
        ) : null}
      </FormSection>

      <SubmitButton
        label={isSubmitting ? 'Saving...' : isEditingProfile ? 'Save profile' : 'Save and continue'}
        onPress={() => void handleSubmit(onSubmit)()}
        disabled={isSubmitting}
      />
    </ScreenScroll>
  );
}
