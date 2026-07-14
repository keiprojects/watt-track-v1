import { Text, View } from 'react-native';

type MetricCardProps = {
  label: string;
  value: string;
  tone?: 'default' | 'accent';
  helper?: string;
};

export function MetricCard({ label, value, tone = 'default', helper }: MetricCardProps) {
  const backgroundColor = tone === 'accent' ? '#ecfeff' : '#ffffff';
  const valueColor = tone === 'accent' ? '#155e75' : '#0f172a';

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
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <Text selectable style={{ color: valueColor, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      {helper ? <Text style={{ color: '#64748b', fontSize: 12, lineHeight: 18 }}>{helper}</Text> : null}
    </View>
  );
}
