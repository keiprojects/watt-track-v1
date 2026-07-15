import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  AppButton,
  IconBadge,
  MotionSection,
  Panel,
  SectionTitle,
  StatPill,
  useScreenContentContainerStyle,
} from '@/components/app-ui';
import { BreakdownDonut } from '@/components/breakdown-donut';
import { MetricCard } from '@/components/metric-card';
import { SegmentedControl } from '@/components/segmented-control';
import { SparkBars } from '@/components/spark-bars';
import {
  aggregateReadingsByDate,
  estimatePaybackForecast,
  filterCostsByRange,
  filterInsightsReadingsByRange,
  summarizeReadings,
  summarizeRoi,
  type InsightsRange,
  type PaybackForecastWindow,
} from '@/services/calculation.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import type { CostTreatment, SystemCost, SystemCostCategory } from '@/types/cost';
import { formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';
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

const forecastOptions: { label: string; value: PaybackForecastWindow; icon: 'trending-up-outline' }[] = [
  { label: '30 days', value: '30d', icon: 'trending-up-outline' },
  { label: '90 days', value: '90d', icon: 'trending-up-outline' },
  { label: 'All time', value: 'all', icon: 'trending-up-outline' },
];

const rangeOptions: { label: string; value: InsightsRange; icon: 'calendar-outline' | 'pulse-outline' }[] = [
  { label: '7d', value: '7d', icon: 'pulse-outline' },
  { label: '30d', value: '30d', icon: 'pulse-outline' },
  { label: 'This month', value: 'current-month', icon: 'calendar-outline' },
  { label: 'Last month', value: 'previous-month', icon: 'calendar-outline' },
  { label: 'This year', value: 'current-year', icon: 'calendar-outline' },
  { label: 'All', value: 'all', icon: 'calendar-outline' },
  { label: 'Custom', value: 'custom', icon: 'calendar-outline' },
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
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>{label}</Text>
      {helper ? <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 18 }}>{helper}</Text> : null}
      {children}
      {error ? <Text style={{ color: theme.dangerText, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

function InsightRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text selectable style={{ color: accent ? theme.accent : theme.text, fontSize: 14, fontWeight: '800' }}>
        {value}
      </Text>
    </View>
  );
}

function inputStyle(theme: ReturnType<typeof useAppTheme>) {
  return {
    borderRadius: 16,
    borderCurve: 'continuous' as const,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceRaised,
    padding: 14,
    color: theme.text,
  };
}

export default function InsightsScreen() {
  const theme = useAppTheme();
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const saveCost = useCostsStore((state) => state.saveCost);
  const updateCost = useCostsStore((state) => state.updateCost);
  const deleteCost = useCostsStore((state) => state.deleteCost);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const { formatCurrency, formatKwh, formatPercent } = useAppFormatters();
  const contentContainerStyle = useScreenContentContainerStyle();

  const [forecastWindow, setForecastWindow] = useState<PaybackForecastWindow>('30d');
  const [selectedRange, setSelectedRange] = useState<InsightsRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState(getTodayDateInputValue());
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

  const today = getTodayDateInputValue();

  const filteredReadings = useMemo(
    () =>
      filterInsightsReadingsByRange({
        readings,
        today,
        range: selectedRange,
        customStartDate: selectedRange === 'custom' ? customStartDate || undefined : undefined,
        customEndDate: selectedRange === 'custom' ? customEndDate || undefined : undefined,
      }),
    [customEndDate, customStartDate, readings, selectedRange, today],
  );

  const filteredCosts = useMemo(
    () =>
      filterCostsByRange({
        costs,
        today,
        range: selectedRange,
        customStartDate: selectedRange === 'custom' ? customStartDate || undefined : undefined,
        customEndDate: selectedRange === 'custom' ? customEndDate || undefined : undefined,
      }),
    [costs, customEndDate, customStartDate, selectedRange, today],
  );

  const summary = useMemo(() => summarizeReadings(filteredReadings), [filteredReadings]);
  const dailySummaries = useMemo(() => aggregateReadingsByDate(filteredReadings), [filteredReadings]);
  const overallRoi = useMemo(() => summarizeRoi({ profile: systemProfile, readings, costs }), [costs, readings, systemProfile]);
  const roi = useMemo(
    () => summarizeRoi({ profile: systemProfile, readings: filteredReadings, costs: filteredCosts }),
    [filteredCosts, filteredReadings, systemProfile],
  );
  const paybackForecast = useMemo(
    () => estimatePaybackForecast({ readings, remainingAmount: overallRoi.remainingAmount, window: forecastWindow }),
    [forecastWindow, overallRoi.remainingAmount, readings],
  );

  const averageDailySavings = dailySummaries.length === 0 ? 0 : summary.estimatedSavings / dailySummaries.length;
  const averageMonthlySavings = averageDailySavings * 30;
  const averageSolarPerDay = dailySummaries.length === 0 ? 0 : summary.solarGeneratedKwh / dailySummaries.length;
  const solarContribution = summary.homeUsageKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.homeUsageKwh) * 100;
  const selfConsumptionShare = summary.solarGeneratedKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.solarGeneratedKwh) * 100;
  const averageDailyGridCost = dailySummaries.length === 0 ? 0 : summary.estimatedGridCost / dailySummaries.length;
  const highestSolarDay = dailySummaries.reduce<typeof dailySummaries[number] | undefined>((highest, reading) => {
    if (!highest || reading.solarGenerationKwh > highest.solarGenerationKwh) {
      return reading;
    }

    return highest;
  }, undefined);
  const lowestSolarDay = dailySummaries.reduce<typeof dailySummaries[number] | undefined>((lowest, reading) => {
    if (!lowest || reading.solarGenerationKwh < lowest.solarGenerationKwh) {
      return reading;
    }

    return lowest;
  }, undefined);

  const chartValues = useMemo(
    () => dailySummaries.slice(-7).map((reading) => reading.estimatedHomeUsageKwh),
    [dailySummaries],
  );
  const chartLabels = useMemo(
    () =>
      dailySummaries.slice(-7).map((reading) =>
        new Intl.DateTimeFormat('en-PH', {
          weekday: 'short',
          timeZone: 'Asia/Manila',
        }).format(new Date(`${reading.date}T00:00:00`)),
      ),
    [dailySummaries],
  );

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

  const rangeHasInvalidCustomDates =
    selectedRange === 'custom' && Boolean(customStartDate && customEndDate && customStartDate > customEndDate);
  const paybackStatusHelper = !paybackForecast.hasEnoughSavingsData
    ? 'Not enough savings data'
    : overallRoi.remainingAmount === 0
      ? 'Investment recovered'
      : `${paybackForecast.basedOnReadingCount} reading day(s) in forecast`;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={contentContainerStyle}
    >
      <MotionSection index={0}>
        <Panel tone="inverse" style={{ backgroundColor: theme.header }}>
          <SectionTitle
            title="Insights"
            description="Analytics, payback, and cost tracking in the dark energy-console style."
            icon="bar-chart-outline"
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <StatPill icon="calendar-outline" label="Range" value={selectedRange === 'custom' ? 'Custom' : selectedRange.replace('-', ' ')} tone="accent" />
            <StatPill icon="wallet-outline" label="Avg month" value={formatCurrency(averageMonthlySavings)} />
            <StatPill icon="rocket-outline" label="Payback" value={formatPercent(roi.paybackProgress)} tone="warning" />
          </View>
        </Panel>
      </MotionSection>

      <MotionSection index={1}>
        <Panel tone="muted" padding={18}>
          <SectionTitle title="Time range" description="Choose the period you want to analyze." icon="options-outline" />
          <SegmentedControl options={rangeOptions} value={selectedRange} onChange={setSelectedRange} />
          {selectedRange === 'custom' ? (
            <View style={{ gap: 12 }}>
              <FilterField label="Start date" value={customStartDate} onChangeText={setCustomStartDate} />
              <FilterField label="End date" value={customEndDate} onChangeText={setCustomEndDate} />
              {rangeHasInvalidCustomDates ? (
                <Text style={{ color: theme.dangerText, fontSize: 13 }}>End date must be on or after the start date.</Text>
              ) : null}
            </View>
          ) : null}
        </Panel>
      </MotionSection>

      <MotionSection index={2}>
        <Panel tone="muted" padding={18}>
          <SectionTitle
            title="Payback forecast"
            description="Projected from your saved readings and tracked costs."
            icon="trending-up-outline"
          />
          <SegmentedControl options={forecastOptions} value={forecastWindow} onChange={setForecastWindow} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <MetricCard
              label="Remaining to recover"
              value={formatCurrency(overallRoi.remainingAmount)}
              helper="Capital still unrecovered"
              icon="construct-outline"
            />
            <MetricCard
              label="Forecast daily savings"
              value={formatCurrency(paybackForecast.averageDailySavings)}
              helper="Estimated"
              tone="accent"
              icon="cash-outline"
            />
            <MetricCard
              label="Projected payback"
              value={paybackForecast.estimatedPaybackDate ? formatShortDate(paybackForecast.estimatedPaybackDate) : 'TBD'}
              helper={paybackStatusHelper}
              icon="time-outline"
            />
          </View>
        </Panel>
      </MotionSection>

      {filteredReadings.length === 0 ? (
        <Panel>
          <SectionTitle
            title="No readings in range"
            description="Change the selected range or add more readings to populate this view."
            icon="hourglass-outline"
          />
        </Panel>
      ) : (
        <>
          <MotionSection index={3}>
            <Panel>
              <SectionTitle
                title="Energy Breakdown"
                description="A more literal analytics card, closer to your reference."
                icon="pie-chart-outline"
              />
              <BreakdownDonut
                centerValue={summary.homeUsageKwh.toFixed(1)}
                centerLabel="kWh"
                segments={[
                  { color: theme.accent, label: 'Solar', value: formatKwh(summary.solarGeneratedKwh) },
                  { color: '#52a3ff', label: 'Grid', value: formatKwh(summary.gridConsumedKwh) },
                  { color: '#9b5cff', label: 'Self-use', value: formatKwh(summary.selfConsumedSolarKwh) },
                  { color: '#ff9f2e', label: 'Usage', value: formatKwh(summary.homeUsageKwh) },
                ]}
              />
            </Panel>
          </MotionSection>

          <MotionSection index={4}>
            <Panel>
              <SectionTitle
                title="Peak Usage"
                description={highestSolarDay ? `${formatKwh(highestSolarDay.solarGenerationKwh)} on ${formatShortDate(highestSolarDay.date)}` : 'Recent trend'}
                icon="trending-up-outline"
              />
              <SparkBars values={chartValues} highlightIndex={Math.max(0, chartValues.length - 3)} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                {chartLabels.map((label) => (
                  <Text key={label} style={{ flex: 1, textAlign: 'center', color: theme.textSubtle, fontSize: 11, fontWeight: '700' }}>
                    {label}
                  </Text>
                ))}
              </View>
            </Panel>
          </MotionSection>

          <MotionSection index={5}>
            <Panel>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: theme.textSubtle, fontSize: 12, fontWeight: '800' }}>Total Usage</Text>
                  <Text selectable style={{ color: theme.text, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                    {formatKwh(summary.homeUsageKwh)}
                  </Text>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                    {averageDailySavings > 0 ? `${formatCurrency(averageDailySavings)} avg daily savings` : 'Estimated from saved readings'}
                  </Text>
                </View>
                <IconBadge icon="bar-chart-outline" size={56} />
              </View>
            </Panel>
          </MotionSection>

          <MotionSection index={6} style={{ gap: 12 }}>
            <SectionTitle
              title="Financial breakdown"
              description="Savings, ROI, and cost pressure in a cleaner set of rows."
              icon="wallet-outline"
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <MetricCard label="Estimated savings" value={formatCurrency(roi.totalEstimatedSavings)} helper="Within range" tone="accent" icon="cash-outline" />
              <MetricCard label="Avg daily savings" value={formatCurrency(averageDailySavings)} helper="Estimated" icon="calendar-outline" />
              <MetricCard label="ROI" value={formatPercent(roi.roiPercentage)} helper="Net benefit / capital" icon="trending-up-outline" />
              <MetricCard label="Remaining to recover" value={formatCurrency(roi.remainingAmount)} helper="Unrecovered capital" icon="construct-outline" />
            </View>
            <Panel tone="muted" padding={16}>
              <InsightRow label="Total capital invested" value={formatCurrency(roi.totalCapitalInvestment)} />
              <InsightRow label="Additional capital costs" value={formatCurrency(roi.additionalCapitalCosts)} />
              <InsightRow label="Maintenance expenses" value={formatCurrency(roi.maintenanceCosts)} />
              <InsightRow label="Net financial benefit" value={formatCurrency(roi.netSavings)} accent />
              <InsightRow label="Solar contribution" value={formatPercent(solarContribution)} />
              <InsightRow label="Self-consumption" value={formatPercent(selfConsumptionShare)} />
              <InsightRow label="Avg solar / day" value={formatKwh(averageSolarPerDay)} />
              <InsightRow label="Avg daily grid cost" value={formatCurrency(averageDailyGridCost)} />
              <InsightRow label="Lowest day" value={lowestSolarDay ? `${formatKwh(lowestSolarDay.solarGenerationKwh)} on ${formatShortDate(lowestSolarDay.date)}` : 'No readings'} />
            </Panel>
          </MotionSection>
        </>
      )}

      <MotionSection index={7}>
        <Panel>
          <SectionTitle
            title={editingCostId ? 'Edit tracked cost' : 'Track a system cost'}
            description="Keep capital and maintenance separated so ROI stays honest."
            icon="card-outline"
          />

          <Field label="Date" helper="Use YYYY-MM-DD" error={errors.date?.message}>
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <TextInput value={value} onChangeText={onChange} style={inputStyle(theme)} placeholderTextColor={theme.textSubtle} />
              )}
            />
          </Field>

          <Field label="Category" error={errors.category?.message}>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <SegmentedControl options={costCategoryOptions} value={value} onChange={onChange} />
              )}
            />
          </Field>

          <Field label="Treatment" helper="Capital affects investment. Maintenance reduces net savings." error={errors.costTreatment?.message}>
            <Controller
              control={control}
              name="costTreatment"
              render={({ field: { onChange, value } }) => (
                <SegmentedControl options={costTreatmentOptions} value={value} onChange={onChange} />
              )}
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
                  placeholderTextColor={theme.textSubtle}
                  style={inputStyle(theme)}
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
                  placeholderTextColor={theme.textSubtle}
                  style={inputStyle(theme)}
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
                  placeholder="Labor, supplier, warranty..."
                  placeholderTextColor={theme.textSubtle}
                  multiline
                  style={[inputStyle(theme), { minHeight: 88, textAlignVertical: 'top' }]}
                />
              )}
            />
          </Field>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <AppButton
              label={editingCostId ? 'Update cost' : 'Save cost'}
              icon="save-outline"
              onPress={() => void handleSubmit(onSubmit)()}
              disabled={isSubmitting}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            {editingCostId ? (
              <AppButton label="Cancel" icon="close-outline" tone="secondary" fullWidth={false} style={{ flex: 1 }} onPress={cancelEditing} />
            ) : null}
          </View>
        </Panel>
      </MotionSection>

      <MotionSection index={8}>
        <Panel>
          <SectionTitle
            title="Tracked costs"
            description="These rows feed directly into ROI, net benefit, and payback."
            icon="receipt-outline"
          />
          {costs.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
              No extra costs saved yet. Add maintenance, repair, or capital items when they happen.
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {costs.map((cost) => (
                <View
                  key={cost.id}
                  style={{
                    gap: 12,
                    borderRadius: 20,
                    borderCurve: 'continuous',
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceRaised,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                      <IconBadge icon="card-outline" tone={cost.costTreatment === 'capital' ? 'accent' : 'muted'} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{cost.description}</Text>
                        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
                          {formatShortDate(cost.date)} | {cost.category} | {cost.costTreatment}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.accent, fontSize: 15, fontWeight: '800' }}>{formatCurrency(cost.amount)}</Text>
                  </View>

                  {cost.notes ? <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 18 }}>{cost.notes}</Text> : null}

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <AppButton label="Edit" icon="create-outline" tone="secondary" fullWidth={false} style={{ flex: 1 }} onPress={() => startEditingCost(cost)} />
                    <AppButton label="Delete" icon="trash-outline" tone="danger" fullWidth={false} style={{ flex: 1 }} onPress={() => onDeleteCost(cost)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Panel>
      </MotionSection>
    </ScrollView>
  );
}

function FilterField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textSubtle}
        style={inputStyle(theme)}
      />
    </View>
  );
}
