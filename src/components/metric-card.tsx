import { Text, View } from 'react-native';

import { IconBadge, type AppIconName } from '@/components/app-ui';
import { useAppTheme } from '@/theme/use-app-theme';

type MetricCardProps = {
  label: string;
  value: string;
  icon?: AppIconName;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
  helper?: string;
};

export function MetricCard({ label, value, icon = 'stats-chart-outline', tone = 'default', helper }: MetricCardProps) {
  const theme = useAppTheme();
  const palette =
    tone === 'danger'
      ? { backgroundColor: theme.dangerSoft, valueColor: theme.dangerText, iconTone: 'danger' as const }
      : tone === 'warning'
        ? { backgroundColor: theme.warningSoft, valueColor: theme.warningText, iconTone: 'warning' as const }
        : tone === 'accent'
          ? { backgroundColor: theme.surfaceAccent, valueColor: theme.accent, iconTone: 'accent' as const }
          : { backgroundColor: theme.surfaceRaised, valueColor: theme.text, iconTone: 'muted' as const };

  return (
    <View
      style={{
        flex: 1,
        minWidth: 156,
        gap: 12,
        borderRadius: 20,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: palette.backgroundColor,
        padding: 16,
        boxShadow: theme.shadow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text selectable style={{ flex: 1, color: theme.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>
          {label}
        </Text>
        <IconBadge icon={icon} tone={palette.iconTone} size={34} />
      </View>
      <Text
        selectable
        style={{
          color: palette.valueColor,
          fontSize: 26,
          fontWeight: '800',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      {helper ? (
        <Text selectable style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
