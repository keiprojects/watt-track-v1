import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

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
import { fetchCurrentWeather } from '@/services/weather.service';
import { useCostsStore } from '@/stores/costs.store';
import { useReadingsStore } from '@/stores/readings.store';
import { useSystemStore } from '@/stores/system.store';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';
import { formatMonthDayLabel, formatShortDate, getTodayDateInputValue } from '@/utils/date';
import { useAppFormatters } from '@/utils/format';

const heroImage = require('../../../assets/images/solar-home-hero-card.png');

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

function WeatherSummary({ location }: { location?: string }) {
  const theme = useAppTheme();
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetchCurrentWeather({ location })
      .then((snapshot) => {
        if (isMounted) {
          setTemperature(Math.round(snapshot.temperatureC));
        }
      })
      .catch(() => {
        if (isMounted) {
          setTemperature(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location]);

  return (
    <View style={{ alignItems: 'flex-end', gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Ionicons name="sunny" size={24} color={theme.warningText} />
        <Text style={{ color: theme.text, fontSize: 16, fontFamily: fontFamilies.bodyHeavy }}>
          {temperature == null ? '28' : String(temperature)}
          {'\u00B0C'}
        </Text>
      </View>
      <Text numberOfLines={1} style={{ maxWidth: 120, color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
        {location ?? 'Local weather'}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const readings = useReadingsStore((state) => state.readings);
  const costs = useCostsStore((state) => state.costs);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const { formatCurrency } = useAppFormatters();
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
    ? dailySummaries.map((summary) => ({ value: summary.estimatedSavings, label: formatMonthDayLabel(summary.date) }))
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
        <WeatherSummary location={systemProfile?.location} />
      </View>

      <SoftCard padding={0}>
        <Image
          source={heroImage}
          resizeMode="cover"
          style={{ width: '100%', height: 172 }}
        />
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
          icon="grid"
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
              <Ionicons name="grid" size={17} color={theme.accent} />
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
          />
        </View>
        <IconSquare icon="wallet" colors={wattGradients.amber} size={44} />
      </SoftCard>
    </ScreenScroll>
  );
}
