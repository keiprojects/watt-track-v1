import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { useReadingsStore } from '@/store/readings.store';

const readingSchema = z.object({
  watts: z.coerce.number().positive('Watts must be greater than zero'),
  durationMinutes: z.coerce.number().positive('Duration must be greater than zero'),
  notes: z.string().optional(),
});

type ReadingForm = z.infer<typeof readingSchema>;

export default function AddReadingScreen() {
  const addReading = useReadingsStore((state) => state.addReading);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ReadingForm>({
    resolver: zodResolver(readingSchema),
    defaultValues: { watts: 0, durationMinutes: 60, notes: '' },
  });

  const onSubmit = async (values: ReadingForm) => {
    await addReading({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      watts: values.watts,
      durationMinutes: values.durationMinutes,
      direction: 'consumed',
      notes: values.notes,
      recordedAt: new Date().toISOString(),
    });
    reset();
    Alert.alert('Reading saved');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add reading</Text>
      <Text style={styles.label}>Watts</Text>
      <Controller control={control} name="watts" render={({ field: { onChange, value } }) => (
        <TextInput keyboardType="numeric" onChangeText={onChange} style={styles.input} value={String(value)} />
      )} />
      {errors.watts ? <Text style={styles.error}>{errors.watts.message}</Text> : null}

      <Text style={styles.label}>Duration (minutes)</Text>
      <Controller control={control} name="durationMinutes" render={({ field: { onChange, value } }) => (
        <TextInput keyboardType="numeric" onChangeText={onChange} style={styles.input} value={String(value)} />
      )} />
      {errors.durationMinutes ? <Text style={styles.error}>{errors.durationMinutes.message}</Text> : null}

      <Text style={styles.label}>Notes</Text>
      <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
        <TextInput onChangeText={onChange} placeholder="Optional context" style={styles.input} value={value} />
      )} />

      <Pressable style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Save reading</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 24, color: '#0f172a' },
  label: { color: '#334155', fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: 12, borderWidth: 1, padding: 14 },
  error: { color: '#dc2626', marginTop: 6 },
  button: { alignItems: 'center', backgroundColor: '#22c55e', borderRadius: 14, marginTop: 24, padding: 16 },
  buttonText: { color: '#052e16', fontWeight: '800' },
});
