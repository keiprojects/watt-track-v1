import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import { DateTimePickerField } from '@/components/date-time-picker-field';
import { DateRangeFilterSheet } from '@/components/date-range-filter-sheet';
import {
  DatePill,
  IconButton,
  IconSquare,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  SoftCard,
  wattGradients,
} from '@/components/watt-ui';
import {
  aggregateReadingsByDate,
  estimatePaybackForecast,
  getBillingCycleWindow,
  summarizeGridMeterReadings,
  summarizeReadings,
  summarizeRoi,
} from '@/services/calculation.service';
import {
  estimateGridBill,
  filterReadingsForAnalyticsRange,
  getAnalyticsRangeLabel,
  getEffectiveBillCycleWindow,
  roundMoney,
  shiftAnalyticsAnchorDate,
  type AnalyticsRange,
} from '@/services/insights.service';
import { useBillingCyclesStore } from '@/stores/billing-cycles.store';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import type { CostTreatment, SystemCost, SystemCostCategory } from '@/types/cost';
import type { BillingCycleOverride } from '@/types/billing';
import {
  formatMonthDayLabel,
  formatShortDate,
  formatWeekdayLabel,
  getTodayDateInputValue,
  isDateWithinRange,
  isValidDateInputValue,
} from '@/utils/date';
import { useAppFormatters } from '@/utils/format';
import { createId } from '@/utils/ids';

type ForecastWindow = '30d' | '90d' | 'all';
type FlowIonIconName = ComponentProps<typeof Ionicons>['name'];
type FlowMaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type FlowIconFamily = 'ionicons' | 'material-community';
type CostDraft = {
  date: string;
  category: SystemCostCategory;
  costTreatment: CostTreatment;
  description: string;
  amount: string;
  notes: string;
};
type BillCycleDraft = {
  startDate: string;
  endDate: string;
  importRate: string;
};

const rangeOptions: { label: string; value: AnalyticsRange }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const forecastOptions: { label: string; value: ForecastWindow }[] = [
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

const costCategoryOptions: { label: string; value: SystemCostCategory }[] = [
  { label: 'Install', value: 'installation' },
  { label: 'Maint.', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Upgrade', value: 'upgrade' },
  { label: 'Other', value: 'other' },
];

const costTreatmentOptions: { label: string; value: CostTreatment }[] = [
  { label: 'Capital', value: 'capital' },
  { label: 'Maintenance', value: 'maintenance' },
];

function createDefaultCostDraft(): CostDraft {
  return {
    date: getTodayDateInputValue(),
    category: 'installation',
    costTreatment: 'capital',
    description: '',
    amount: '',
    notes: '',
  };
}

function formatCompactKwh(value: number): string {
  return value.toFixed(1);
}

function formatEnergy(value: number): string {
  return `${formatCompactKwh(value)} kWh`;
}

function createBillCycleDraft(): BillCycleDraft {
  return {
    startDate: '',
    endDate: '',
    importRate: '',
  };
}

function getDateDisplayValue(date: string): string {
  return isValidDateInputValue(date) ? formatShortDate(date) : date;
}

function inputStyle(theme: ReturnType<typeof useAppTheme>) {
  return {
    minHeight: 48,
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

function PillButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderCurve: 'continuous',
        backgroundColor: selected ? theme.accent : 'transparent',
        opacity: pressed ? 0.74 : 1,
      })}
    >
      <Text style={{ color: selected ? '#ffffff' : theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
        {label}
      </Text>
    </Pressable>
  );
}

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: selected ? theme.primaryChart : theme.border,
        backgroundColor: selected ? theme.statusBackground : theme.surface,
        paddingHorizontal: 13,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text style={{ color: selected ? theme.statusText : theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  icon,
  tone = 'primary',
  onPress,
}: {
  label: string;
  icon: 'save-outline' | 'create-outline' | 'trash-outline' | 'close-outline';
  tone?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const color = tone === 'primary' ? '#ffffff' : tone === 'danger' ? theme.dangerText : theme.text;
  const backgroundColor = tone === 'primary' ? theme.accent : tone === 'danger' ? theme.dangerSoft : theme.surface;
  const borderColor = tone === 'primary' ? theme.accent : tone === 'danger' ? theme.dangerSoft : theme.border;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor,
        backgroundColor,
        paddingHorizontal: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>{label}</Text>
    </Pressable>
  );
}

function FormField({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>{label}</Text>
      {helper ? <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>{helper}</Text> : null}
      {children}
    </View>
  );
}

function FinancialMetric({
  label,
  value,
  helper,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  helper: string;
  icon: 'cash-outline' | 'calendar-outline' | 'trending-up-outline' | 'construct-outline' | 'time-outline';
  tone?: 'default' | 'green';
}) {
  const theme = useAppTheme();
  const isGreen = tone === 'green';

  return (
    <SoftCard tone={isGreen ? 'green' : 'plain'} padding={12} style={{ flex: 1, minWidth: 150, minHeight: 126 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ flex: 1, color: theme.textMuted, fontSize: 13, lineHeight: 17, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
        <View
          style={{
            height: 34,
            width: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: isGreen ? theme.statusBackground : theme.surfaceMuted,
          }}
        >
          <Ionicons name={icon} size={18} color={isGreen ? theme.statusText : theme.textMuted} />
        </View>
      </View>
      <Text
        selectable
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.62}
        style={{ color: isGreen ? theme.statusText : theme.text, fontSize: 25, fontFamily: fontFamilies.bodyHeavy, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>{helper}</Text>
    </SoftCard>
  );
}

function InsightRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const theme = useAppTheme();

  return (
    <View style={{ minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ flex: 1, color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
      <Text
        selectable
        numberOfLines={2}
        style={{ maxWidth: '58%', color: accent ? theme.statusText : theme.text, fontSize: 14, textAlign: 'right', fontFamily: fontFamilies.bodyHeavy }}
      >
        {value}
      </Text>
    </View>
  );
}

function BillStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        minWidth: 124,
        gap: 5,
        borderRadius: 12,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        padding: 10,
      }}
    >
      <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
        style={{ color: accent ? theme.accent : theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

function FlowNode({
  icon,
  iconFamily = 'ionicons',
  label,
  value,
  tone,
}: {
  icon: FlowIonIconName | FlowMaterialCommunityIconName;
  iconFamily?: FlowIconFamily;
  label: string;
  value: string;
  tone: 'amber' | 'blue' | 'green';
}) {
  const theme = useAppTheme();
  const color = tone === 'amber' ? theme.warningText : tone === 'green' ? theme.primaryChart : theme.accent;
  const backgroundColor = tone === 'amber' ? theme.warningSoft : tone === 'green' ? theme.statusBackground : theme.accentSoft;

  return (
    <View
      style={{
        height: 88,
        width: 88,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: color,
        backgroundColor,
      }}
    >
      {iconFamily === 'material-community' ? (
        <MaterialCommunityIcons name={icon as FlowMaterialCommunityIconName} size={22} color={color} />
      ) : (
        <Ionicons name={icon as FlowIonIconName} size={21} color={color} />
      )}
      <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 10, textAlign: 'center', fontFamily: fontFamilies.body }}>{label}</Text>
    </View>
  );
}

function EnergyFlow({
  generated,
  grid,
  used,
  exported,
  saved,
}: {
  generated: number;
  grid: number;
  used: number;
  exported: number;
  saved: number;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 4 }}>
      <FlowNode icon="sunny" label="Generated" value={`${formatCompactKwh(generated)} kWh`} tone="amber" />
      <Ionicons name="arrow-down" size={18} color={theme.textSubtle} />
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
        <FlowNode icon="transmission-tower" iconFamily="material-community" label="From Grid" value={`${formatCompactKwh(grid)} kWh`} tone="blue" />
        <Ionicons name="arrow-forward" size={15} color={theme.textSubtle} />
        <FlowNode icon="home" label="Used" value={`${formatCompactKwh(used)} kWh`} tone="blue" />
        <Ionicons name="arrow-forward" size={15} color={theme.textSubtle} />
        <FlowNode icon="return-up-forward-outline" label="Exported" value={`${formatCompactKwh(exported)} kWh`} tone="green" />
      </View>
      <Ionicons name="arrow-down" size={18} color={theme.textSubtle} />
      <FlowNode icon="leaf" label="Saved" value={`${formatCompactKwh(saved)} kWh`} tone="green" />
    </View>
  );
}

export default function InsightsScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const readings = useReadingsStore((state) => state.readings);
  const cycleOverrides = useBillingCyclesStore((state) => state.cycleOverrides);
  const saveCycleOverride = useBillingCyclesStore((state) => state.saveCycleOverride);
  const deleteCycleOverride = useBillingCyclesStore((state) => state.deleteCycleOverride);
  const costs = useCostsStore((state) => state.costs);
  const saveCost = useCostsStore((state) => state.saveCost);
  const updateCost = useCostsStore((state) => state.updateCost);
  const deleteCost = useCostsStore((state) => state.deleteCost);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const { formatCurrency, formatKwh, formatPercent, formatRate } = useAppFormatters();
  const today = getTodayDateInputValue();
  const [selectedRange, setSelectedRange] = useState<AnalyticsRange>('day');
  const [anchorDate, setAnchorDate] = useState(today);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [forecastWindow, setForecastWindow] = useState<ForecastWindow>('30d');
  const [currentCycleDraft, setCurrentCycleDraft] = useState<BillCycleDraft>(() => createBillCycleDraft());
  const [costDraft, setCostDraft] = useState<CostDraft>(() => createDefaultCostDraft());
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const hasDateFilter = Boolean(fromDate || toDate);

  const filteredReadings = useMemo(
    () =>
      hasDateFilter
        ? readings.filter((reading) => isDateWithinRange(reading.date, fromDate || undefined, toDate || undefined))
        : filterReadingsForAnalyticsRange(readings, anchorDate, selectedRange),
    [anchorDate, fromDate, hasDateFilter, readings, selectedRange, toDate],
  );
  const summary = useMemo(() => {
    const readingSummary = summarizeReadings(filteredReadings);

    if (systemProfile?.gridInputMode !== 'cumulative') {
      return readingSummary;
    }

    const gridMeterSummary = summarizeGridMeterReadings(filteredReadings);

    if (gridMeterSummary.gridReadingCount < 2) {
      return readingSummary;
    }

    return {
      ...readingSummary,
      gridConsumedKwh: gridMeterSummary.totalGridMeterConsumptionKwh,
      estimatedGridCost: gridMeterSummary.estimatedGridMeterCost,
      homeUsageKwh: roundMoney(gridMeterSummary.totalGridMeterConsumptionKwh + readingSummary.selfConsumedSolarKwh),
    };
  }, [filteredReadings, systemProfile?.gridInputMode]);
  const computedBillingCycleWindow = useMemo(
    () => getBillingCycleWindow({ today, billingCycleStartDay: systemProfile?.billingCycleStartDay }),
    [systemProfile?.billingCycleStartDay, today],
  );
  const currentCycleOverride = cycleOverrides.find((override) => override.anchorCycleStartDate === computedBillingCycleWindow.startDate);
  const billingCycleWindow = getEffectiveBillCycleWindow({
    fallbackStartDate: computedBillingCycleWindow.startDate,
    fallbackEndDate: computedBillingCycleWindow.endDate,
    today,
    override: currentCycleOverride,
  });
  const billingCycleReadingsEndDate = today.localeCompare(billingCycleWindow.endDate) <= 0 ? today : billingCycleWindow.endDate;
  const billingCycleReadings = useMemo(
    () => readings.filter((reading) => isDateWithinRange(reading.date, billingCycleWindow.startDate, billingCycleReadingsEndDate)),
    [billingCycleReadingsEndDate, billingCycleWindow.startDate, readings],
  );
  const billingCycleGridMeterSummary = useMemo(() => summarizeGridMeterReadings(billingCycleReadings), [billingCycleReadings]);
  const billingCycleEstimate = estimateGridBill(
    billingCycleGridMeterSummary,
    systemProfile?.defaultImportRate ?? 0,
    currentCycleOverride?.importRate,
  );
  const lifetimeRoi = useMemo(() => summarizeRoi({ profile: systemProfile, readings, costs }), [costs, readings, systemProfile]);
  const paybackForecast = useMemo(
    () => estimatePaybackForecast({ readings, remainingAmount: lifetimeRoi.remainingAmount, window: forecastWindow }),
    [forecastWindow, lifetimeRoi.remainingAmount, readings],
  );
  const exportedEnergyKwh = filteredReadings.reduce((sum, reading) => sum + reading.exportedEnergyKwh, 0);
  const rangeDailySummaries = useMemo(() => aggregateReadingsByDate(filteredReadings), [filteredReadings]);
  const dailySummaries = useMemo(() => rangeDailySummaries.slice(-8), [rangeDailySummaries]);
  const averageDailySavings = rangeDailySummaries.length === 0 ? 0 : summary.estimatedSavings / rangeDailySummaries.length;
  const averageSolarPerDay = rangeDailySummaries.length === 0 ? 0 : summary.solarGeneratedKwh / rangeDailySummaries.length;
  const averageDailyGridCost = rangeDailySummaries.length === 0 ? 0 : summary.estimatedGridCost / rangeDailySummaries.length;
  const averageBillingCycleGridCost = billingCycleEstimate.cost / billingCycleWindow.elapsedDays;
  const expectedGridMonthlyBill = averageBillingCycleGridCost * billingCycleWindow.totalDays;
  const billingCycleProgress = Math.min(100, Math.max(0, (billingCycleWindow.elapsedDays / billingCycleWindow.totalDays) * 100));
  const billingCycleRate = billingCycleEstimate.rate;
  const solarContribution = summary.homeUsageKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.homeUsageKwh) * 100;
  const selfConsumptionShare = summary.solarGeneratedKwh === 0 ? 0 : (summary.selfConsumedSolarKwh / summary.solarGeneratedKwh) * 100;
  const lowestSolarDay = rangeDailySummaries.reduce<(typeof rangeDailySummaries)[number] | undefined>((lowest, reading) => {
    if (!lowest || reading.solarGenerationKwh < lowest.solarGenerationKwh) {
      return reading;
    }

    return lowest;
  }, undefined);
  const chartWidth = Math.min(width - 56, 360);
  const barData = dailySummaries.length
    ? dailySummaries.flatMap((summaryItem) => [
        {
          value: summaryItem.solarGenerationKwh,
          label: formatWeekdayLabel(summaryItem.date),
          frontColor: theme.primaryChart,
        },
        {
          value: summaryItem.gridConsumptionKwh,
          frontColor: theme.accent,
        },
      ])
    : [
        { value: 0, label: 'Sun', frontColor: theme.primaryChart },
        { value: 0, frontColor: theme.accent },
      ];
  const savingsValues = dailySummaries.map((summaryItem) => summaryItem.estimatedSavings);
  const savingsTrendValues =
    savingsValues.length === 0 ? [0, 0, 0] : savingsValues.length === 1 ? [savingsValues[0], savingsValues[0], savingsValues[0]] : savingsValues;
  const savingsLineData = savingsTrendValues.map((value) => ({ value }));
  const savingsChartMax = Math.max(...savingsTrendValues, 1) * 1.15;
  const pieData = [
    { value: Math.max(summary.solarGeneratedKwh, 0.01), color: theme.warningText, text: 'Generated' },
    { value: Math.max(summary.selfConsumedSolarKwh, 0.01), color: theme.primaryChart, text: 'Self' },
    { value: Math.max(exportedEnergyKwh, 0.01), color: theme.accent, text: 'Export' },
    { value: Math.max(summary.gridConsumedKwh, 0.01), color: theme.textMuted, text: 'Grid' },
  ];
  const rangeLabel = hasDateFilter ? 'Custom range' : getAnalyticsRangeLabel(anchorDate, selectedRange);
  const billingCycleLabel = `${formatMonthDayLabel(billingCycleWindow.startDate)} - ${formatMonthDayLabel(billingCycleWindow.endDate)}`;
  const gridBillHelper =
    billingCycleEstimate.cost > 0
      ? `${formatCurrency(billingCycleEstimate.cost)} cycle-to-date${billingCycleEstimate.hasOverride ? ' at bill rate' : ''}`
      : 'Add grid readings to project bill';
  const projectedPaybackLabel = paybackForecast.estimatedPaybackDate ? formatShortDate(paybackForecast.estimatedPaybackDate) : 'TBD';
  const paybackHelper = !paybackForecast.hasEnoughSavingsData
    ? 'Add more savings data'
    : lifetimeRoi.remainingAmount === 0
      ? 'Investment recovered'
      : `${paybackForecast.basedOnReadingCount} day basis`;

  const shiftDate = (direction: -1 | 1) => {
    const shiftedDate = shiftAnalyticsAnchorDate(anchorDate, selectedRange, direction);
    setAnchorDate(shiftedDate > today ? today : shiftedDate);
  };

  const updateCostDraftField = <Key extends keyof CostDraft>(key: Key, value: CostDraft[Key]) => {
    setCostDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  };

  const updateCurrentCycleDraftField = <Key extends keyof BillCycleDraft>(key: Key, value: BillCycleDraft[Key]) => {
    setCurrentCycleDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  };

  const resetCostDraft = () => {
    setEditingCostId(null);
    setCostDraft(createDefaultCostDraft());
  };

  const saveBillingCycleDraft = async ({
    anchorCycleStartDate,
    fallbackStartDate,
    fallbackEndDate,
    draft,
    existingOverride,
    clearDraft,
  }: {
    anchorCycleStartDate: string;
    fallbackStartDate: string;
    fallbackEndDate: string;
    draft: BillCycleDraft;
    existingOverride?: BillingCycleOverride;
    clearDraft: () => void;
  }) => {
    const cycleStartDate = draft.startDate || existingOverride?.cycleStartDate || fallbackStartDate;
    const cycleEndDate = draft.endDate || existingOverride?.cycleEndDate || fallbackEndDate;
    const importRate = draft.importRate.trim() ? Number(draft.importRate) : existingOverride?.importRate;

    if (!isValidDateInputValue(cycleStartDate) || !isValidDateInputValue(cycleEndDate) || cycleStartDate > cycleEndDate) {
      Alert.alert('Check the bill period', 'Enter a valid start and end date for the utility bill period.');
      return;
    }

    if (typeof importRate === 'number' && (!Number.isFinite(importRate) || importRate <= 0)) {
      Alert.alert('Check the bill rate', 'Enter a valid import rate, or leave it blank to keep using reading rates.');
      return;
    }

    const now = new Date().toISOString();
    await saveCycleOverride({
      id: existingOverride?.id ?? createId('bill-cycle'),
      anchorCycleStartDate,
      cycleStartDate,
      cycleEndDate,
      importRate,
      createdAt: existingOverride?.createdAt ?? now,
      updatedAt: now,
    });
    clearDraft();
    Alert.alert('Bill cycle saved', 'This cycle will use the saved bill period and rate without editing historical readings.');
  };

  const clearBillingCycleOverride = async (overrideId: string) => {
    await deleteCycleOverride(overrideId);
    Alert.alert('Bill cycle cleared', 'This cycle is back to the profile billing day and reading rates.');
  };

  const startEditingCost = (cost: SystemCost) => {
    setEditingCostId(cost.id);
    setCostDraft({
      date: cost.date,
      category: cost.category,
      costTreatment: cost.costTreatment,
      description: cost.description,
      amount: String(cost.amount),
      notes: cost.notes ?? '',
    });
  };

  const saveCostDraft = async () => {
    const amount = Number(costDraft.amount || 0);

    if (!isValidDateInputValue(costDraft.date) || costDraft.date > today) {
      Alert.alert('Check the date', 'Use a real date that is not in the future.');
      return;
    }

    if (!costDraft.description.trim()) {
      Alert.alert('Add a description', 'Name the repair, upgrade, maintenance, or install cost.');
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert('Check the amount', 'Use a valid amount of 0 or higher.');
      return;
    }

    const now = new Date().toISOString();
    const existingCost = editingCostId ? costs.find((cost) => cost.id === editingCostId) : undefined;
    const costRecord: SystemCost = {
      id: existingCost?.id ?? createId('cost'),
      date: costDraft.date,
      category: costDraft.category,
      costTreatment: costDraft.costTreatment,
      description: costDraft.description.trim(),
      amount,
      notes: costDraft.notes.trim() || undefined,
      createdAt: existingCost?.createdAt ?? now,
      updatedAt: now,
    };

    if (existingCost) {
      await updateCost(costRecord);
      Alert.alert('Cost updated', 'ROI and payback were recalculated.');
    } else {
      await saveCost(costRecord);
      Alert.alert('Cost saved', 'The new cost is included in ROI and payback.');
    }

    resetCostDraft();
  };

  const confirmDeleteCost = (cost: SystemCost) => {
    Alert.alert('Delete cost?', `${cost.description} will be removed from your ROI history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteCost(cost.id);
          if (editingCostId === cost.id) {
            resetCostDraft();
          }
        },
      },
    ]);
  };

  return (
    <>
      <ScreenScroll gap={16}>
        <ScreenHeader
          title="Analytics"
          leftIcon="chevron-back"
          leftLabel="Back"
          rightIcon="filter-outline"
          rightLabel="Filter analytics"
          onLeftPress={() => router.push('/(tabs)')}
          onRightPress={() => setFiltersOpen(true)}
        />

        <SoftCard padding={4} style={{ flexDirection: 'row', backgroundColor: theme.surfaceMuted }}>
          {rangeOptions.map((option) => (
            <PillButton
              key={option.value}
              label={option.label}
              selected={!hasDateFilter && option.value === selectedRange}
              onPress={() => {
                setFromDate('');
                setToDate('');
                setSelectedRange(option.value);
              }}
            />
          ))}
        </SoftCard>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <IconButton icon="chevron-back" label="Previous range" onPress={() => shiftDate(-1)} />
          <DatePill label={rangeLabel} />
          <IconButton icon="chevron-forward" label="Next range" onPress={() => shiftDate(1)} />
        </View>

        <View style={{ gap: 12 }}>
          <SectionHeader title="Energy Flow" />
          <EnergyFlow
            generated={summary.solarGeneratedKwh}
            grid={summary.gridConsumedKwh}
            used={summary.homeUsageKwh}
            exported={exportedEnergyKwh}
            saved={summary.selfConsumedSolarKwh}
          />
        </View>

        <SoftCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>Generation vs Consumption</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ color: theme.primaryChart, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Generated</Text>
              <Text style={{ color: theme.accent, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Consumed</Text>
            </View>
          </View>
          <View style={{ pointerEvents: 'none' }}>
            <BarChart
              data={barData}
              width={chartWidth}
              height={220}
              barWidth={8}
              spacing={10}
              initialSpacing={8}
              endSpacing={8}
              roundedTop
              hideRules={false}
              rulesColor={theme.chartGrid}
              xAxisColor={theme.border}
              yAxisColor="transparent"
              yAxisTextStyle={{ color: theme.textSubtle, fontSize: 10, fontFamily: fontFamilies.body }}
              xAxisLabelTextStyle={{ color: theme.textSubtle, fontSize: 10, fontFamily: fontFamilies.body }}
              noOfSections={4}
              disableScroll
            />
          </View>
        </SoftCard>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Reports" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SoftCard tone="amber" style={{ flex: 1 }} padding={10}>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Generated</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.bodyHeavy }}>{formatCompactKwh(summary.solarGeneratedKwh)}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>kWh</Text>
            </SoftCard>
            <SoftCard tone="blue" style={{ flex: 1 }} padding={10}>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Consumed</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.bodyHeavy }}>{formatCompactKwh(summary.gridConsumedKwh)}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>kWh</Text>
            </SoftCard>
            <SoftCard tone="green" style={{ flex: 1 }} padding={10}>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Saved</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.bodyHeavy }}>{formatCompactKwh(summary.selfConsumedSolarKwh)}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>kWh</Text>
            </SoftCard>
          </View>
        </View>

        <SoftCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>Estimated Savings</Text>
            <Text selectable style={{ color: theme.text, fontSize: 26, fontFamily: fontFamilies.bodyHeavy }}>
              {formatCurrency(summary.estimatedSavings)}
            </Text>
            <Text style={{ color: theme.primaryChart, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
              ROI {formatPercent(lifetimeRoi.roiPercentage)}
            </Text>
          </View>
          <View style={{ pointerEvents: 'none', width: Math.min(chartWidth, 185) }}>
            <LineChart
              data={savingsLineData}
              width={Math.min(chartWidth, 185)}
              height={112}
              curved
              areaChart
              hideAxesAndRules
              hideDataPoints
              disableScroll
              color={theme.accent}
              startFillColor={theme.accent}
              endFillColor={theme.accent}
              startOpacity={0.26}
              endOpacity={0.02}
              thickness={2}
              maxValue={savingsChartMax}
              initialSpacing={0}
              endSpacing={0}
            />
          </View>
        </SoftCard>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 10 }}>
          <SoftCard tone="blue" style={{ flex: 1, minWidth: 280 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>Expected Grid Monthly Bill</Text>
                <Text
                  selectable
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}
                  style={{ color: theme.text, fontSize: 28, fontFamily: fontFamilies.bodyHeavy, fontVariant: ['tabular-nums'] }}
                >
                  {formatCurrency(expectedGridMonthlyBill)}
                </Text>
                <Text style={{ color: theme.accent, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>{gridBillHelper}</Text>
              </View>
              <IconSquare icon="receipt-outline" colors={wattGradients.blue} size={46} />
            </View>

            <View style={{ height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: theme.surface }}>
              <View style={{ width: `${billingCycleProgress}%`, height: '100%', borderRadius: 999, backgroundColor: theme.accent }} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <BillStat label="Cycle" value={billingCycleLabel} />
              <BillStat label="Days" value={`${billingCycleWindow.elapsedDays}/${billingCycleWindow.totalDays}`} />
              <BillStat label="Avg / day" value={formatCurrency(averageBillingCycleGridCost)} accent />
              <BillStat label={billingCycleEstimate.hasOverride ? 'Bill rate' : 'Rate'} value={formatRate(billingCycleRate)} />
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>Bill cycle override</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <DateTimePickerField
                    mode="date"
                    value={currentCycleDraft.startDate}
                    displayValue={currentCycleDraft.startDate ? getDateDisplayValue(currentCycleDraft.startDate) : ''}
                    placeholder={formatShortDate(billingCycleWindow.startDate)}
                    onChange={(value) => updateCurrentCycleDraftField('startDate', value)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DateTimePickerField
                    mode="date"
                    value={currentCycleDraft.endDate}
                    displayValue={currentCycleDraft.endDate ? getDateDisplayValue(currentCycleDraft.endDate) : ''}
                    placeholder={formatShortDate(billingCycleWindow.endDate)}
                    onChange={(value) => updateCurrentCycleDraftField('endDate', value)}
                  />
                </View>
              </View>
              <TextInput
                value={currentCycleDraft.importRate}
                onChangeText={(value) => updateCurrentCycleDraftField('importRate', value)}
                keyboardType="numeric"
                placeholder={formatRate(billingCycleRate)}
                placeholderTextColor={theme.textSubtle}
                style={inputStyle(theme)}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ActionButton
                  label="Save cycle"
                  icon="save-outline"
                  onPress={() =>
                    void saveBillingCycleDraft({
                      anchorCycleStartDate: computedBillingCycleWindow.startDate,
                      fallbackStartDate: computedBillingCycleWindow.startDate,
                      fallbackEndDate: computedBillingCycleWindow.endDate,
                      draft: currentCycleDraft,
                      existingOverride: currentCycleOverride,
                      clearDraft: () => setCurrentCycleDraft(createBillCycleDraft()),
                    })
                  }
                />
                {currentCycleOverride ? (
                  <ActionButton
                    label="Clear"
                    icon="close-outline"
                    tone="secondary"
                    onPress={() => void clearBillingCycleOverride(currentCycleOverride.id)}
                  />
                ) : null}
              </View>
            </View>
          </SoftCard>
        </View>

        <SoftCard>
          <SectionHeader title="Breakdown" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <PieChart
              data={pieData}
              donut
              radius={86}
              innerRadius={48}
              innerCircleColor={theme.surface}
              strokeWidth={3}
              strokeColor={theme.surface}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontFamily: fontFamilies.bodyHeavy }}>
                    {formatCompactKwh(summary.homeUsageKwh)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: fontFamilies.body }}>kWh</Text>
                </View>
              )}
            />
            <View style={{ flex: 1, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: theme.warningText }} />
                <Text style={{ flex: 1, color: theme.text, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                  Solar generated {formatCompactKwh(summary.solarGeneratedKwh)} kWh
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: theme.primaryChart }} />
                <Text style={{ flex: 1, color: theme.text, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                  Self-consumed {formatCompactKwh(summary.selfConsumedSolarKwh)} kWh
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: theme.accent }} />
                <Text style={{ flex: 1, color: theme.text, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                  Exported {formatCompactKwh(exportedEnergyKwh)} kWh
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ height: 10, width: 10, borderRadius: 999, backgroundColor: theme.textMuted }} />
                <Text style={{ flex: 1, color: theme.text, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
                  Grid {formatCompactKwh(summary.gridConsumedKwh)} kWh
                </Text>
              </View>
            </View>
          </View>
        </SoftCard>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Payback Forecast" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {forecastOptions.map((option) => (
              <OptionChip
                key={option.value}
                label={option.label}
                selected={forecastWindow === option.value}
                onPress={() => setForecastWindow(option.value)}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <FinancialMetric
              label="Projected payback"
              value={projectedPaybackLabel}
              helper={paybackHelper}
              icon="time-outline"
              tone="green"
            />
            <FinancialMetric
              label="Forecast daily savings"
              value={formatCurrency(paybackForecast.averageDailySavings)}
              helper="Estimated"
              icon="calendar-outline"
            />
            <FinancialMetric
              label="Remaining to recover"
              value={formatCurrency(lifetimeRoi.remainingAmount)}
              helper="All-time capital"
              icon="construct-outline"
            />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Financial Breakdown" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <FinancialMetric
              label="Gross savings"
              value={formatCurrency(lifetimeRoi.totalEstimatedSavings)}
              helper="All-time before maintenance"
              icon="cash-outline"
              tone="green"
            />
            <FinancialMetric
              label="Avg daily savings"
              value={formatCurrency(averageDailySavings)}
              helper="Estimated"
              icon="calendar-outline"
            />
            <FinancialMetric
              label="ROI"
              value={formatPercent(lifetimeRoi.roiPercentage)}
              helper="Net benefit / capital"
              icon="trending-up-outline"
            />
            <FinancialMetric
              label="Remaining to recover"
              value={formatCurrency(lifetimeRoi.remainingAmount)}
              helper="Unrecovered capital"
              icon="construct-outline"
            />
          </View>
          <SoftCard>
            <InsightRow label="Total capital invested" value={formatCurrency(lifetimeRoi.totalCapitalInvestment)} />
            <InsightRow label="Additional capital costs" value={formatCurrency(lifetimeRoi.additionalCapitalCosts)} />
            <InsightRow label="Gross estimated savings" value={formatCurrency(lifetimeRoi.totalEstimatedSavings)} />
            <InsightRow
              label="Maintenance deducted"
              value={lifetimeRoi.maintenanceCosts === 0 ? formatCurrency(0) : `-${formatCurrency(lifetimeRoi.maintenanceCosts)}`}
            />
            <InsightRow label="Net financial benefit" value={formatCurrency(lifetimeRoi.netSavings)} accent />
            <InsightRow label="Solar contribution" value={formatPercent(solarContribution)} />
            <InsightRow label="Self-consumption" value={formatPercent(selfConsumptionShare)} />
            <InsightRow label="Avg solar / day" value={formatKwh(averageSolarPerDay)} />
            <InsightRow label="Avg daily grid cost" value={formatCurrency(averageDailyGridCost)} />
            <InsightRow
              label="Lowest day"
              value={lowestSolarDay ? `${formatEnergy(lowestSolarDay.solarGenerationKwh)} on ${formatShortDate(lowestSolarDay.date)}` : 'No readings'}
            />
          </SoftCard>
        </View>

        <SoftCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconSquare icon="card-outline" colors={wattGradients.green} size={44} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={{ color: theme.text, fontSize: 17, fontFamily: fontFamilies.bodyHeavy }}>
                {editingCostId ? 'Edit system cost' : 'Track a system cost'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18, fontFamily: fontFamilies.body }}>
                Keep capital and maintenance separated so ROI stays honest.
              </Text>
            </View>
          </View>

          <FormField label="Date">
            <DateTimePickerField
              mode="date"
              value={costDraft.date}
              displayValue={getDateDisplayValue(costDraft.date)}
              placeholder="Pick a date"
              maximumDate={new Date()}
              onChange={(value) => updateCostDraftField('date', value)}
            />
          </FormField>

          <FormField label="Category">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {costCategoryOptions.map((option) => (
                <OptionChip
                  key={option.value}
                  label={option.label}
                  selected={costDraft.category === option.value}
                  onPress={() => updateCostDraftField('category', option.value)}
                />
              ))}
            </View>
          </FormField>

          <FormField label="Treatment" helper="Capital affects investment. Maintenance reduces net savings.">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {costTreatmentOptions.map((option) => (
                <OptionChip
                  key={option.value}
                  label={option.label}
                  selected={costDraft.costTreatment === option.value}
                  onPress={() => updateCostDraftField('costTreatment', option.value)}
                />
              ))}
            </View>
          </FormField>

          <FormField label="Description">
            <TextInput
              value={costDraft.description}
              onChangeText={(value) => updateCostDraftField('description', value)}
              placeholder="Inverter replacement"
              placeholderTextColor={theme.textSubtle}
              style={inputStyle(theme)}
            />
          </FormField>

          <FormField label="Amount">
            <TextInput
              value={costDraft.amount}
              onChangeText={(value) => updateCostDraftField('amount', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textSubtle}
              style={inputStyle(theme)}
            />
          </FormField>

          <FormField label="Notes" helper="Optional">
            <TextInput
              value={costDraft.notes}
              onChangeText={(value) => updateCostDraftField('notes', value)}
              placeholder="Labor, supplier, warranty..."
              placeholderTextColor={theme.textSubtle}
              multiline
              style={[inputStyle(theme), { minHeight: 90, textAlignVertical: 'top' }]}
            />
          </FormField>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ActionButton label={editingCostId ? 'Update cost' : 'Save cost'} icon="save-outline" onPress={() => void saveCostDraft()} />
            {editingCostId ? <ActionButton label="Cancel" icon="close-outline" tone="secondary" onPress={resetCostDraft} /> : null}
          </View>
        </SoftCard>

        <View style={{ gap: 10 }}>
          <SectionHeader title="Tracked Costs" />
          {costs.length === 0 ? (
            <SoftCard>
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>No extra costs tracked yet</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>
                Add repairs, upgrades, maintenance, and other system costs here so ROI stays accurate.
              </Text>
            </SoftCard>
          ) : (
            <View style={{ gap: 10 }}>
              {costs.map((cost) => (
                <SoftCard key={cost.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flexDirection: 'row', flex: 1, minWidth: 0, gap: 12 }}>
                      <View
                        style={{
                          height: 44,
                          width: 44,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 15,
                          borderCurve: 'continuous',
                          backgroundColor: cost.costTreatment === 'capital' ? theme.statusBackground : theme.surfaceMuted,
                        }}
                      >
                        <Ionicons name="card-outline" size={20} color={cost.costTreatment === 'capital' ? theme.primaryChart : theme.textMuted} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                        <Text numberOfLines={2} style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>
                          {cost.description}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
                          {formatShortDate(cost.date)} | {cost.category} | {cost.costTreatment}
                        </Text>
                      </View>
                    </View>
                    <Text
                      selectable
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      style={{ maxWidth: 110, color: theme.statusText, fontSize: 15, textAlign: 'right', fontFamily: fontFamilies.bodyHeavy }}
                    >
                      {formatCurrency(cost.amount)}
                    </Text>
                  </View>

                  {cost.notes ? <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.body }}>{cost.notes}</Text> : null}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <ActionButton label="Edit" icon="create-outline" tone="secondary" onPress={() => startEditingCost(cost)} />
                    <ActionButton label="Delete" icon="trash-outline" tone="danger" onPress={() => confirmDeleteCost(cost)} />
                  </View>
                </SoftCard>
              ))}
            </View>
          )}
        </View>
      </ScreenScroll>

      <DateRangeFilterSheet
        visible={filtersOpen}
        title="Filter analytics"
        startDate={fromDate}
        endDate={toDate}
        onStartDateChange={setFromDate}
        onEndDateChange={setToDate}
        onApply={() => setFiltersOpen(false)}
        onReset={() => {
          setFromDate('');
          setToDate('');
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
