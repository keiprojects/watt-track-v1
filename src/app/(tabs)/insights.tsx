import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';

import { MetricCard } from '@/components/metric-card';
import { SegmentedControl } from '@/components/segmented-control';
import { estimatePaybackForecast, summarizeReadings, summarizeRoi, type PaybackForecastWindow } from '@/services/calculation.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import type { CostTreatment, SystemCost, SystemCostCategory } from '@/types/cost';
import { formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { formatCurrency, formatKwh, formatPercent } from '@/utils/format';
import { createId } from '@/utils/ids';

const costSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  category: z.enum(['installation', 'maintenance', 'repair', 'upgrade', 'other'] satisfies SystemCostCategory[]),
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
  costTreatment: z.enum(['capital', 'maintenance'] satisfies CostTreatment[]),
  notes: z.string().optional(),
});

type CostFormValues = z.infer<typeof costSchema>;

const forecastOptions: { label: string; value: PaybackForecastWindow }[] = [
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

const costCategoryOptions: { label: string; value: SystemCostCategory }[] = [
  { label: 'Installation', value: 'installation' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Upgrade', value: 'upgrade' },
  { label: 'Other', value: 'other' },
];

const costTreatmentOptions: { label: string; value: CostTreatment }[] = [
  { label: 'Capital', value: 'capital' },
  { label: 'Maintenance', value: 'maintenance' },
];

function createDefaultCostValues(): CostFormValues {
  return {
    date: getTodayDateInputValue(),
    category: 'installation',
    description: '',
    amount: 0,
    costTreatment: 'capital',
    notes: '',
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

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        gap: 14,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor: '#ffffff',
        padding: 18,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>{title}</Text>
        {description ? <Text style={{ color: '#475569', fontSize: 14, lineHeight: 21 }}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function getForecastHelper(window: PaybackForecastWindow): string {
  if (window === '30d') {
    return 'Projected from the most recent 30 days with saved readings.';
  }

  if (window === '90d') {
    return 'Projected from the most recent 90 days with saved readings.';
  }

  return 'Projected from every saved reading on this device.';
}

export default function InsightsScreen() {
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const saveCost = useCostsStore((state) => state.saveCost);
  const updateCost = useCostsStore((state) => state.updateCost);
  const deleteCost = useCostsStore((state) => state.deleteCost);
  const systemProfile = useSystemStore((state) => state.systemProfile);

  const [forecastWindow, setForecastWindow] = useState<PaybackForecastWindow>('30d');
  const [editingCostId, setEditingCostId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CostFormValues>({
    resolver: zodResolver(costSchema) as Resolver<CostFormValues>,
    defaultValues: createDefaultCostValues(),
  });

  const summary = useMemo(() => summarizeReadings(readings), [readings]);
  const roi = useMemo(() => summarizeRoi({ profile: systemProfile, readings, costs }), [costs, readings, systemProfile]);
  const paybackForecast = useMemo(
    () => estimatePaybackForecast({ readings, remainingAmount: roi.remainingAmount, window: forecastWindow }),
    [forecastWindow, readings, roi.remainingAmount],
  );

  const averageDailySavings = readings.length === 0 ? 0 : roi.totalEstimatedSavings / readings.length;
  const averageMonthlySavings = averageDailySavings * 30;
  const solarContribution = summary.homeUsageKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.homeUsageKwh) * 100;
  const selfConsumptionShare = summary.solarGeneratedKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.solarGeneratedKwh) * 100;
  const averageDailyGridCost = readings.length === 0 ? 0 : summary.estimatedGridCost / readings.length;
  const highestSolarDay = readings.reduce((highest, reading) => {
    if (!highest || reading.solarGenerationKwh > highest.solarGenerationKwh) {
      return reading;
    }

    return highest;
  }, readings[0]);
  const lowestSolarDay = readings.reduce((lowest, reading) => {
    if (!lowest || reading.solarGenerationKwh < lowest.solarGenerationKwh) {
      return reading;
    }

    return lowest;
  }, readings[0]);

  const startEditingCost = (cost: SystemCost) => {
    setEditingCostId(cost.id);
    reset({
      date: cost.date,
      category: cost.category,
      description: cost.description,
      amount: cost.amount,
      costTreatment: cost.costTreatment,
      notes: cost.notes ?? '',
    });
  };

  const cancelEditing = () => {
    setEditingCostId(null);
    reset(createDefaultCostValues());
  };

  const onSubmit = async (values: CostFormValues) => {
    const now = new Date().toISOString();
    const existingCost = editingCostId ? costs.find((cost) => cost.id === editingCostId) : undefined;

    const costRecord: SystemCost = {
      id: existingCost?.id ?? createId('cost'),
      date: values.date,
      category: values.category,
      description: values.description.trim(),
      amount: values.amount,
      costTreatment: values.costTreatment,
      notes: values.notes?.trim() || undefined,
      createdAt: existingCost?.createdAt ?? now,
      updatedAt: now,
    };

    if (existingCost) {
      await updateCost(costRecord);
      Alert.alert('Cost updated', 'ROI and payback estimates were recalculated.');
    } else {
      await saveCost(costRecord);
      Alert.alert('Cost saved', 'The new cost is now included in ROI and payback.');
    }

    cancelEditing();
  };

  const onDeleteCost = (cost: SystemCost) => {
    Alert.alert('Delete cost?', `${cost.description} will be removed from your ROI history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteCost(cost.id);
          if (editingCostId === cost.id) {
            cancelEditing();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800' }}>Insights</Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
          Review all-time energy performance, manage system costs, and project how quickly savings can recover your investment.
        </Text>
      </View>

      <SectionCard title="Payback forecast" description={getForecastHelper(forecastWindow)}>
        <SegmentedControl options={forecastOptions} value={forecastWindow} onChange={setForecastWindow} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard label="Remaining to recover" value={formatCurrency(roi.remainingAmount)} />
          <MetricCard label="Forecast daily savings" value={formatCurrency(paybackForecast.averageDailySavings)} helper="Estimated" tone="accent" />
          <MetricCard
            label="Projected payback"
            value={paybackForecast.estimatedPaybackDate ? formatShortDate(paybackForecast.estimatedPaybackDate) : 'TBD'}
            helper={
              paybackForecast.hasEnoughSavingsData
                ? roi.remainingAmount === 0
                  ? 'Investment recovered'
                  : `${paybackForecast.basedOnReadingCount} reading(s) in forecast`
                : 'Not enough savings data'
            }
          />
        </View>
      </SectionCard>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Energy</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard label="Solar generated" value={formatKwh(summary.solarGeneratedKwh)} tone="accent" />
          <MetricCard label="Avg solar per day" value={formatKwh(readings.length === 0 ? 0 : summary.solarGeneratedKwh / readings.length)} />
          <MetricCard label="Grid consumed" value={formatKwh(summary.gridConsumedKwh)} />
          <MetricCard label="Avg grid cost" value={formatCurrency(averageDailyGridCost)} helper="Estimated" />
          <MetricCard label="Home usage" value={formatKwh(summary.homeUsageKwh)} />
          <MetricCard label="Solar contribution" value={formatPercent(solarContribution)} />
          <MetricCard label="Self-consumption" value={formatPercent(selfConsumptionShare)} />
          <MetricCard
            label="Best solar day"
            value={highestSolarDay ? formatKwh(highestSolarDay.solarGenerationKwh) : formatKwh(0)}
            helper={highestSolarDay ? formatShortDate(highestSolarDay.date) : 'No readings'}
          />
          <MetricCard
            label="Lowest solar day"
            value={lowestSolarDay ? formatKwh(lowestSolarDay.solarGenerationKwh) : formatKwh(0)}
            helper={lowestSolarDay ? formatShortDate(lowestSolarDay.date) : 'No readings'}
          />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800' }}>Financial</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard label="Estimated savings" value={formatCurrency(roi.totalEstimatedSavings)} helper="Estimated" tone="accent" />
          <MetricCard label="Avg daily savings" value={formatCurrency(averageDailySavings)} helper="Estimated" />
          <MetricCard label="Avg monthly savings" value={formatCurrency(averageMonthlySavings)} helper="Estimated" />
          <MetricCard label="Initial system cost" value={formatCurrency(systemProfile?.initialSystemCost ?? 0)} />
          <MetricCard label="Extra capital costs" value={formatCurrency(roi.additionalCapitalCosts)} />
          <MetricCard label="Maintenance expenses" value={formatCurrency(roi.maintenanceCosts)} />
          <MetricCard label="Net benefit" value={formatCurrency(roi.netSavings)} />
          <MetricCard label="ROI" value={formatPercent(roi.roiPercentage)} />
          <MetricCard label="Payback progress" value={formatPercent(roi.paybackProgress)} />
        </View>
      </View>

      <SectionCard title={editingCostId ? 'Edit system cost' : 'Add system cost'} description="Track one-off investment and ongoing maintenance separately so ROI stays accurate.">
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

        <Field label="Category" error={errors.category?.message}>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => <SegmentedControl options={costCategoryOptions} value={value} onChange={onChange} />}
          />
        </Field>

        <Field label="Treatment" helper="Capital affects investment; maintenance reduces net savings." error={errors.costTreatment?.message}>
          <Controller
            control={control}
            name="costTreatment"
            render={({ field: { onChange, value } }) => <SegmentedControl options={costTreatmentOptions} value={value} onChange={onChange} />}
          />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Inverter replacement"
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

        <Field label="Amount" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={String(value ?? '')}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0"
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

        <Field label="Notes" helper="Optional" error={errors.notes?.message}>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Warranty work, labor, supplier..."
                multiline
                style={{
                  minHeight: 84,
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

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={handleSubmit(onSubmit)}
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
            <Text style={{ color: '#f0fdfa', fontSize: 16, fontWeight: '800' }}>{editingCostId ? 'Update cost' : 'Save cost'}</Text>
          </Pressable>

          {editingCostId ? (
            <Pressable
              onPress={cancelEditing}
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
              <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Cancel edit</Text>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Tracked costs" description="These entries feed directly into ROI, net benefit, and payback calculations.">
        {costs.length === 0 ? (
          <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22 }}>
            No extra costs saved yet. Add maintenance, repair, upgrade, or other capital items when they happen.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {costs.map((cost) => (
              <View
                key={cost.id}
                style={{
                  gap: 10,
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: '#f8fafc',
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>{cost.description}</Text>
                    <Text style={{ color: '#475569', fontSize: 14 }}>
                      {formatShortDate(cost.date)} | {cost.category} | {cost.costTreatment}
                    </Text>
                  </View>
                  <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>{formatCurrency(cost.amount)}</Text>
                </View>

                {cost.notes ? <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18 }}>{cost.notes}</Text> : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => startEditingCost(cost)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      borderCurve: 'continuous',
                      backgroundColor: '#dbeafe',
                      padding: 12,
                    }}
                  >
                    <Text style={{ color: '#1d4ed8', fontSize: 14, fontWeight: '700' }}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDeleteCost(cost)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      borderCurve: 'continuous',
                      backgroundColor: '#fee2e2',
                      padding: 12,
                    }}
                  >
                    <Text style={{ color: '#b91c1c', fontSize: 14, fontWeight: '700' }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </SectionCard>
    </ScrollView>
  );
}
