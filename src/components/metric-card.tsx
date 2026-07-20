import { Text, View } from 'react-native';

import { IconBadge, type AppIconName } from '@/components/app-ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

type MetricCardProps = {
  label: string;
  value: string;
  icon?: AppIconName;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
  helper?: string;
};

export function MetricCard({ label, value, icon = 'stats-chart-outline', tone = 'default', helper }: MetricCardProps) {
  const theme = useAppTheme();
  const accentValueColor = theme.mode === 'light' ? theme.accentText : theme.accent;
  const palette =
    tone === 'danger'
      ? {
          backgroundColor: theme.dangerSoft,
          valueColor: theme.dangerText,
          helperColor: theme.dangerText,
          borderColor: theme.mode === 'dark' ? 'rgba(255, 153, 153, 0.18)' : 'rgba(180, 35, 24, 0.12)',
          iconTone: 'danger' as const,
        }
      : tone === 'warning'
        ? {
            backgroundColor: theme.warningSoft,
            valueColor: theme.warningText,
            helperColor: theme.warningText,
            borderColor: theme.mode === 'dark' ? 'rgba(255, 200, 87, 0.18)' : 'rgba(139, 93, 0, 0.12)',
            iconTone: 'warning' as const,
          }
        : tone === 'accent'
          ? {
              backgroundColor: theme.surfaceAccent,
              valueColor: accentValueColor,
              helperColor: accentValueColor,
              borderColor: theme.mode === 'dark' ? 'rgba(214, 255, 77, 0.18)' : 'rgba(52, 83, 0, 0.10)',
              iconTone: 'accent' as const,
            }
          : {
              backgroundColor: theme.surfaceRaised,
              valueColor: theme.text,
              helperColor: theme.textSubtle,
              borderColor: theme.border,
              iconTone: 'muted' as const,
            };

  return (
    <View
      style={{
        flex: 1,
        minWidth: 156,
        gap: 14,
        borderRadius: 24,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.borderColor,
        backgroundColor: palette.backgroundColor,
        padding: 18,
        boxShadow: theme.mode === 'dark' ? undefined : '0 12px 28px rgba(7, 14, 28, 0.05)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text
          selectable
          style={{
            flex: 1,
            color: theme.textMuted,
            fontSize: 12,
            fontFamily: fontFamilies.bodyStrong,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
        <IconBadge icon={icon} tone={palette.iconTone} size={34} />
      </View>
      <Text
        selectable
        style={{
          color: palette.valueColor,
          fontSize: 28,
          fontFamily: fontFamilies.bodyHeavy,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      {helper ? (
        <Text
          selectable
          style={{
            color: palette.helperColor,
            fontSize: 12,
            lineHeight: 18,
            fontFamily: fontFamilies.body,
          }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
