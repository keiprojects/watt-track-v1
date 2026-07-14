import { StyleSheet, Text, View } from 'react-native';

import { estimateReadingCost } from '@/services/calculation.service';
import { useReadingsStore } from '@/store/readings.store';

export default function InsightsScreen() {
  const readings = useReadingsStore((state) => state.readings);
  const total = readings.reduce((sum, reading) => sum + estimateReadingCost(reading, { currencyCode: 'USD', ratePerKwh: 0.16 }).amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.card}>Estimated energy cost: ${total.toFixed(2)}</Text>
      <Text style={styles.helper}>More trend and anomaly insights will appear as readings accumulate.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, color: '#0f172a', fontSize: 20, fontWeight: '700', padding: 20 },
  helper: { color: '#64748b', lineHeight: 22 },
});
