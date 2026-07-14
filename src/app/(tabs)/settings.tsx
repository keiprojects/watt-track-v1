import { StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.card}>Default currency: USD</Text>
      <Text style={styles.card}>Default rate: $0.16 / kWh</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 14, color: '#0f172a', fontSize: 16, padding: 16 },
});
