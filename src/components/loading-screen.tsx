import { ActivityIndicator, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = 'Loading WattTrack...' }: LoadingScreenProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: theme.background,
        padding: 24,
      }}
    >
      <ActivityIndicator color={theme.accent} size="large" />
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
