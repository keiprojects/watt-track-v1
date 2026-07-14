import { Text, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type MetricCardProps = {
  label: string;
  value: string;
  tone?: 'default' | 'accent';
  helper?: string;
};

export function MetricCard({ label, value, tone = 'default', helper }: MetricCardProps) {
  const theme = useAppTheme();
  const backgroundColor = tone === 'accent' ? theme.surfaceAccent : theme.surface;
  const valueColor = tone === 'accent' ? theme.accentText : theme.text;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 148,
        gap: 8,
        borderRadius: 8,
        borderCurve: 'continuous',
        backgroundColor,
        padding: 16,
        boxShadow: theme.shadow,
      }}
    >
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <Text selectable style={{ color: valueColor, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      {helper ? <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18 }}>{helper}</Text> : null}
    </View>
  );
}
