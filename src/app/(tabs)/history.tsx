import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useReadingsStore } from '@/store/readings.store';

export default function HistoryScreen() {
  const readings = useReadingsStore((state) => state.readings);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={readings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No readings yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.value}>{item.watts} W for {item.durationMinutes} min</Text>
            <Text style={styles.meta}>{new Date(item.recordedAt).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, color: '#0f172a' },
  empty: { color: '#64748b' },
  row: { backgroundColor: '#ffffff', borderRadius: 14, marginBottom: 10, padding: 16 },
  value: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 4 },
});
