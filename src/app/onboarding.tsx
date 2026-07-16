import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { Alert, Image, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { SegmentedControl } from '@/components/segmented-control';
import { AppButton, MotionSection, Panel, SectionTitle, useScreenContentContainerStyle } from '@/components/app-ui';
import { useReadingsStore } from '@/stores/readings.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { ExportInputMode, ReadingInputMode } from '@/types/system';
import { getTodayDateInputValue, isValidDateInputValue } from '@/utils/date';
import { createId } from '@/utils/ids';

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

const readingModeOptions: { label: string; value: ReadingInputMode }[] = [
  { label: 'Daily usage', value: 'daily' },
  { label: 'Meter reading', value: 'cumulative' },
];

const exportModeOptions: { label: string; value: ExportInputMode }[] = [
  { label: 'Off', value: 'disabled' },
  { label: 'Daily', value: 'daily' },
  { label: 'Cumulative', value: 'cumulative' },
];
const fullLogo = require('../../assets/branding/logo-full.png');

function Field({
  label,
  helper,
  children,
  error,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
  error?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
      {helper ? <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 18, fontFamily: fontFamilies.body }}>{helper}</Text> : null}
      {children}
      {error ? <Text style={{ color: theme.dangerText, fontSize: 13, fontFamily: fontFamilies.body }}>{error}</Text> : null}
    </View>
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
  const contentContainerStyle = useScreenContentContainerStyle({ gap: 20 });

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

  const inputStyle = {
    borderRadius: 18,
    borderCurve: 'continuous' as const,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceRaised,
    padding: 14,
    color: theme.text,
    fontFamily: fontFamilies.body,
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical
      overScrollMode="always"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={contentContainerStyle}
    >
      <MotionSection index={0}>
        <Panel tone="inverse" style={{ backgroundColor: theme.header }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -44,
              right: -26,
              height: 160,
              width: 160,
              borderRadius: 999,
              backgroundColor: theme.accentGlow,
            }}
          />
          <Image
            source={fullLogo}
            resizeMode="contain"
            style={{ width: 200, height: 102, alignSelf: 'center', marginBottom: 4 }}
          />
          <Text
            style={{
              color: theme.accent,
              fontSize: 11,
              fontFamily: fontFamilies.bodyStrong,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            Local-first setup
          </Text>
          <Text style={{ color: theme.textOnDark, fontSize: 34, fontFamily: fontFamilies.display }}>
            {isEditingProfile ? 'Edit WattTrack profile' : 'Set up WattTrack'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22, fontFamily: fontFamilies.body }}>
            {isEditingProfile
              ? 'Update your local system profile, rates, capacities, and reading modes.'
              : 'Save your system profile locally so logging, savings estimates, and ROI can work offline from day one.'}
          </Text>
        </Panel>
      </MotionSection>

      <MotionSection index={1}>
        <Panel style={{ gap: 20 }}>
          <SectionTitle title="System profile" description="Tell WattTrack what system you are tracking." icon="home-outline" eyebrow="Basics" />
        <Field label="System name" error={errors.systemName?.message}>
          <Controller
            control={control}
            name="systemName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Rooftop solar"
                style={inputStyle}
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
                placeholder="Quezon City"
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Installation date" helper="Use YYYY-MM-DD" error={errors.installationDate?.message}>
          <Controller
            control={control}
            name="installationDate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
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
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <View
          style={{
            borderRadius: 20,
            borderCurve: 'continuous',
            backgroundColor: theme.surfaceMuted,
            padding: 14,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyStrong }}>Currency</Text>
          <Text selectable style={{ color: theme.textMuted, marginTop: 4, fontFamily: fontFamilies.body }}>
            PHP (fixed for the MVP)
          </Text>
        </View>
        </Panel>
      </MotionSection>

      <MotionSection index={2}>
        <Panel style={{ gap: 20 }}>
          <SectionTitle title="Rates and capacity" description="Add the baseline numbers WattTrack will use for cost and ROI math." icon="cash-outline" eyebrow="Economics" />
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
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Default import rate" helper="Your grid electricity rate per kWh" error={errors.defaultImportRate?.message}>
          <Controller
            control={control}
            name="defaultImportRate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Solar capacity (kW)" helper="Optional" error={errors.solarCapacityKw?.message}>
          <Controller
            control={control}
            name="solarCapacityKw"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Optional"
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Inverter capacity (kW)" helper="Optional" error={errors.inverterCapacityKw?.message}>
          <Controller
            control={control}
            name="inverterCapacityKw"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Optional"
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>

        <Field label="Battery capacity (kWh)" helper="Optional" error={errors.batteryCapacityKwh?.message}>
          <Controller
            control={control}
            name="batteryCapacityKwh"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value == null ? '' : String(value)}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="Optional"
                style={inputStyle}
                placeholderTextColor={theme.textSubtle}
              />
            )}
          />
        </Field>
        </Panel>
      </MotionSection>

      <MotionSection index={3}>
        <Panel style={{ gap: 20 }}>
          <SectionTitle title="Reading modes" description="Choose whether you log direct daily kWh or the meter's running total." icon="analytics-outline" eyebrow="Inputs" />
        <Field label="Grid input mode" helper="Choose Daily usage if you type kWh directly, or Meter reading if you type the running number shown on the meter base." error={errors.gridInputMode?.message}>
          <Controller
            control={control}
            name="gridInputMode"
            render={({ field: { onChange, value } }) => (
              <SegmentedControl options={readingModeOptions} value={value} onChange={onChange} />
            )}
          />
        </Field>

        <Field label="Solar input mode" helper="Use Meter reading if you log the running solar meter number and want WattTrack to subtract the previous reading." error={errors.solarInputMode?.message}>
          <Controller
            control={control}
            name="solarInputMode"
            render={({ field: { onChange, value } }) => (
              <SegmentedControl options={readingModeOptions} value={value} onChange={onChange} />
            )}
          />
        </Field>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderRadius: 20,
            borderCurve: 'continuous',
            backgroundColor: theme.surfaceMuted,
            padding: 14,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyStrong }}>Track exported energy</Text>
            <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 18, fontFamily: fontFamilies.body }}>
              Turn this on if you want separate export credits in savings calculations.
            </Text>
          </View>
          <Controller
            control={control}
            name="exportEnabled"
            render={({ field: { onChange, value } }) => <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.accent }} />}
          />
        </View>

        {exportEnabled ? (
          <>
            <Field label="Export input mode" error={errors.exportInputMode?.message}>
              <Controller
                control={control}
                name="exportInputMode"
                render={({ field: { onChange, value } }) => (
                  <SegmentedControl options={exportModeOptions} value={value} onChange={onChange} />
                )}
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
                    style={inputStyle}
                    placeholderTextColor={theme.textSubtle}
                  />
                )}
              />
            </Field>
          </>
        ) : null}
        </Panel>
      </MotionSection>

      <AppButton
        label={isSubmitting ? 'Saving...' : isEditingProfile ? 'Save profile' : 'Save and continue'}
        icon="arrow-forward-outline"
        onPress={() => void handleSubmit(onSubmit)()}
        disabled={isSubmitting}
      />
    </ScrollView>
  );
}
