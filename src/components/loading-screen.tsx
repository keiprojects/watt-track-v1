import { ActivityIndicator, Text, View } from 'react-native';

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = 'Loading WattTrack...' }: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#f8fafc',
        padding: 24,
      }}
    >
      <ActivityIndicator color="#0f766e" size="large" />
      <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
