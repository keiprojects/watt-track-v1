import { SectionList, Text, View } from 'react-native';

import { useReadingsStore } from '@/stores/readings.store';
import { formatMonthLabel, formatShortDate } from '@/utils/date';
import { formatCurrency, formatKwh } from '@/utils/format';

export default function HistoryScreen() {
  const readings = useReadingsStore((state) => state.readings);

  const sections = readings.reduce<{ title: string; data: typeof readings }[]>((grouped, reading) => {
    const title = formatMonthLabel(reading.date);
    const existingGroup = grouped.find((section) => section.title === title);

    if (existingGroup) {
      existingGroup.data.push(reading);
      return grouped;
    }

    return [...grouped, { title, data: [reading] }];
  }, []);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 40 }}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={<Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800', marginBottom: 8 }}>History</Text>}
      ListEmptyComponent={
        <View
          style={{
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#ffffff',
            padding: 20,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
          }}
        >
          <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>No readings yet</Text>
          <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22, marginTop: 8 }}>
            Once you save a reading, it will show up here by month with warnings and estimated savings.
          </Text>
        </View>
      }
      renderSectionHeader={({ section: { title } }) => (
        <Text style={{ color: '#334155', fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 10 }}>{title}</Text>
      )}
      renderItem={({ item }) => (
        <View
          style={{
            gap: 8,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: '#ffffff',
            padding: 16,
            marginBottom: 10,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>{formatShortDate(item.date)}</Text>
            {item.warningCodes?.length ? (
              <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '700' }}>{item.warningCodes.length} warning(s)</Text>
            ) : null}
          </View>
          <Text style={{ color: '#475569', fontSize: 14 }}>
            Solar {formatKwh(item.solarGenerationKwh)} • Grid {formatKwh(item.gridConsumptionKwh)}
          </Text>
          <Text style={{ color: '#475569', fontSize: 14 }}>
            Estimated savings {formatCurrency(item.estimatedSavings)} • Grid cost {formatCurrency(item.estimatedGridCost)}
          </Text>
          {item.notes ? <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 18 }}>{item.notes}</Text> : null}
        </View>
      )}
    />
  );
}
