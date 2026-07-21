import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ListChevron, SoftCard } from '@/components/watt-ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export type AboutIconName = ComponentProps<typeof Ionicons>['name'];

export function AboutListCard({ children }: { children: ReactNode }) {
  return <SoftCard padding={0}>{children}</SoftCard>;
}

export function AboutRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: AboutIconName;
  title: string;
  value?: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingHorizontal: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          height: 34,
          width: 34,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          borderCurve: 'continuous',
          backgroundColor: theme.accentSoft,
        }}
      >
        <Ionicons name={icon} size={18} color={theme.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>
          {title}
        </Text>
        {value ? (
          <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
            {value}
          </Text>
        ) : null}
      </View>
      <ListChevron />
    </Pressable>
  );
}

export function AboutTextSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useAppTheme();

  return (
    <SoftCard style={{ gap: 6 }}>
      <Text style={{ color: theme.text, fontSize: 15, fontFamily: fontFamilies.bodyHeavy }}>{title}</Text>
      <Text selectable style={{ color: theme.textMuted, fontSize: 13, lineHeight: 20, fontFamily: fontFamilies.body }}>
        {children}
      </Text>
    </SoftCard>
  );
}
