import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { CurrentWeatherCard } from '@/components/current-weather-card';
import { HouseEnergyHero } from '@/components/house-energy-hero';
import {
  DatePill,
  IconSquare,
  MetricTile,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  SoftCard,
  wattGradients,
} from '@/components/watt-ui';
import {
  aggregateReadingsByDate,
  filterBillingCycleReadings,
  summarizeReadings,
  summarizeRoi,
} from '@/services/calculation.service';
import { useCurrentWeather } from '@/hooks/use-current-weather';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import { formatMonthDayLabel, formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function getDisplayName(systemName?: string): string {
  const compactName = systemName?.replace(/\s+(residence|home|solar|system)$/i, '').trim();
  return compactName?.split(/\s+/)[0] || 'there';
}

function formatCompactKwh(value: number): string {
  return `${value.toFixed(1)} kWh`;
}

function formatDelta(current: number, previous?: number): string | undefined {
  if (!previous || previous <= 0) {
    return undefined;
  }

  const delta = ((current - previous) / previous) * 100;
  const arrow = delta >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(delta).toFixed(0)}%`;
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const { formatCurrency } = useAppFormatters();
  const currentWeather = useCurrentWeather({
    location: systemProfile?.location,
    latitude: systemProfile?.latitude,
    longitude: systemProfile?.longitude,
  });
  const today = getTodayDateInputValue();
  const latestReading = readings[0];
  const previousReading = readings[1];
  const billingReadings = useMemo(
    () =>
      filterBillingCycleReadings({
        readings,
        today,
        billingCycleStartDay: systemProfile?.billingCycleStartDay,
      }),
    [readings, systemProfile?.billingCycleStartDay, today],
  );
  const billingSummary = useMemo(() => summarizeReadings(billingReadings), [billingReadings]);
  const roiSummary = useMemo(() => summarizeRoi({ profile: systemProfile, readings, costs }), [costs, readings, systemProfile]);
  const dailySummaries = useMemo(() => aggregateReadingsByDate(billingReadings).slice(-8), [billingReadings]);
  const sparklineData = dailySummaries.length
    ? dailySummaries.map((summary) => ({ value: summary.estimatedSavings }))
    : [{ value: 0 }, { value: 0 }, { value: 0 }];
  const chartWidth = Math.min(width - 84, 280);

  const currentSolar = latestReading?.solarGenerationKwh ?? billingSummary.solarGeneratedKwh;
  const currentGrid = latestReading?.gridConsumptionKwh ?? billingSummary.gridConsumedKwh;
  const currentSaved = latestReading?.selfConsumedSolarKwh ?? billingSummary.selfConsumedSolarKwh;
  const currentSavings = latestReading?.estimatedSavings ?? billingSummary.estimatedSavings;
  const currentHomeUsage = latestReading?.estimatedHomeUsageKwh ?? billingSummary.homeUsageKwh;
  const recentReadingLabel = latestReading
    ? `Recent reading: ${formatShortDate(latestReading.date)}${latestReading.time ? `, ${latestReading.time}` : ''}`
    : 'Add a reading to see current usage';
  const monthStartLabel = billingReadings.length ? formatMonthDayLabel(billingReadings.at(-1)?.date ?? today) : formatMonthDayLabel(today);

  return (
    <ScreenScroll gap={14}>
      <ScreenHeader
        title="Watt Track"
        titleAlign="left"
        rightIcon="notifications-outline"
        rightLabel="Notifications"
      />

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
            {getGreeting()},
          </Text>
          <Text style={{ color: theme.text, fontSize: 22, fontFamily: fontFamilies.bodyHeavy }}>
            {getDisplayName(systemProfile?.systemName)}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontFamily: fontFamilies.body }}>Here's your energy overview.</Text>
        </View>
        <CurrentWeatherCard
          weather={currentWeather.weather}
          errorMessage={currentWeather.errorMessage}
          isLoading={currentWeather.isLoading}
          variant="compact"
        />
      </View>

      <SoftCard padding={0}>
        <HouseEnergyHero weather={currentWeather.weather} isLoading={currentWeather.isLoading} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open reading history"
          onPress={() => router.push('/(tabs)/history')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingBottom: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View
            style={{
              height: 24,
              width: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: theme.statusText,
            }}
          >
            <Ionicons name="flash" size={15} color="#ffffff" />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>Current Energy Usage</Text>
            <Text
              selectable
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={{ color: theme.text, fontSize: 20, fontFamily: fontFamilies.bodyHeavy, fontVariant: ['tabular-nums'] }}
            >
              {formatCompactKwh(currentHomeUsage)}
            </Text>
            <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.body }}>
              {recentReadingLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
        </Pressable>
      </SoftCard>

      <SectionHeader title="Today's Overview" action={<DatePill label={formatShortDate(today)} />} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MetricTile
          icon="sunny"
          label="Solar Generated"
          value={formatCompactKwh(currentSolar)}
          delta={formatDelta(currentSolar, previousReading?.solarGenerationKwh)}
          colors={wattGradients.amber}
        />
        <MetricTile
          icon="transmission-tower"
          iconFamily="material-community"
          label="Grid Consumed"
          value={formatCompactKwh(currentGrid)}
          delta={formatDelta(currentGrid, previousReading?.gridConsumptionKwh)}
          colors={wattGradients.blue}
        />
        <MetricTile
          icon="home"
          label="Energy Saved"
          value={formatCompactKwh(currentSaved)}
          delta={formatDelta(currentSaved, previousReading?.selfConsumedSolarKwh)}
          colors={wattGradients.green}
        />
        <MetricTile
          icon="trending-up"
          label="ROI"
          value={`${roiSummary.roiPercentage.toFixed(1)}%`}
          helper="Since installation"
          colors={wattGradients.violet}
        />
      </View>

      <SoftCard>
        <Text style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>
          This Month ({monthStartLabel} - {formatMonthDayLabel(today)})
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Generated</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="sunny" size={17} color={theme.warningText} />
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>{formatCompactKwh(billingSummary.solarGeneratedKwh)}</Text>
            </View>
          </View>
          <View style={{ width: 1, backgroundColor: theme.border }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Consumed</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MaterialCommunityIcons name="transmission-tower" size={18} color={theme.accent} />
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>{formatCompactKwh(billingSummary.gridConsumedKwh)}</Text>
            </View>
          </View>
          <View style={{ width: 1, backgroundColor: theme.border }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: fontFamilies.bodyStrong }}>Saved</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="leaf" size={17} color={theme.primaryChart} />
              <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>{formatCompactKwh(billingSummary.selfConsumedSolarKwh)}</Text>
            </View>
          </View>
        </View>
      </SoftCard>

      <SoftCard tone="amber" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>Estimated Savings</Text>
          <Text selectable style={{ color: theme.text, fontSize: 26, fontFamily: fontFamilies.bodyHeavy }}>
            {formatCurrency(billingSummary.estimatedSavings)}
          </Text>
          <Text style={{ color: theme.primaryChart, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
            {currentSavings > 0 ? `${formatCurrency(currentSavings)} latest reading` : 'Add readings to build the trend'}
          </Text>
        </View>
        <View pointerEvents="none" style={{ width: chartWidth, maxWidth: 150, alignItems: 'flex-end' }}>
          <LineChart
            data={sparklineData}
            width={Math.min(chartWidth, 140)}
            height={82}
            curved
            areaChart
            hideAxesAndRules
            hideDataPoints
            disableScroll
            color={theme.accent}
            startFillColor={theme.accent}
            endFillColor={theme.accent}
            startOpacity={0.28}
            endOpacity={0.03}
            thickness={2}
            initialSpacing={0}
            endSpacing={0}
            xAxisLabelsHeight={0}
            labelsExtraHeight={0}
          />
        </View>
        <IconSquare icon="wallet" colors={wattGradients.amber} size={44} />
      </SoftCard>
    </ScreenScroll>
  );
}
