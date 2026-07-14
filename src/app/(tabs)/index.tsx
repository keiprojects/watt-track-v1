import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { summarizeReadings } from '@/services/calculation.service';
import { useReadingsStore } from '@/store/readings.store';

export default function DashboardScreen() {
  const { readings, hydrate, hasHydrated } = useReadingsStore();
  const summary = summarizeReadings(readings);

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Generated</Text>
        <Text style={styles.value}>{summary.generatedKwh.toFixed(2)} kWh</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Consumed</Text>
        <Text style={styles.value}>{summary.consumedKwh.toFixed(2)} kWh</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 20 },
  label: { color: '#64748b', fontSize: 14, marginBottom: 8 },
  value: { color: '#0f172a', fontSize: 30, fontWeight: '800' },
});
