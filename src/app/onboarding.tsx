import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { storageService } from '@/services/storage.service';

export default function OnboardingScreen() {
  const completeOnboarding = async () => {
    await storageService.setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track every watt.</Text>
      <Text style={styles.body}>Log generation and consumption readings, estimate costs, and spot energy trends.</Text>
      <Pressable style={styles.button} onPress={completeOnboarding}>
        <Text style={styles.buttonText}>Get started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  title: { color: '#ffffff', fontSize: 36, fontWeight: '800', marginBottom: 12 },
  body: { color: '#cbd5e1', fontSize: 18, lineHeight: 26, marginBottom: 32 },
  button: { backgroundColor: '#22c55e', borderRadius: 16, padding: 16, alignItems: 'center' },
  buttonText: { color: '#052e16', fontSize: 16, fontWeight: '700' },
});
