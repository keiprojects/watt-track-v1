import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export type WattIconName = ComponentProps<typeof Ionicons>['name'];

type ScreenScrollProps = {
  children: ReactNode;
  gap?: number;
  horizontalPadding?: number;
  topPadding?: number;
  bottomPadding?: number;
};

type ScreenHeaderProps = {
  title: string;
  leftIcon?: WattIconName;
  leftLabel?: string;
  rightIcon?: WattIconName;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  rightLabel?: string;
  titleAlign?: 'center' | 'left';
};

type SoftCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  tone?: 'default' | 'blue' | 'green' | 'amber' | 'plain';
};

type IconButtonProps = {
  icon: WattIconName;
  label: string;
  onPress?: () => void;
  selected?: boolean;
};

type IconSquareProps = {
  icon: WattIconName;
  colors?: readonly [string, string];
  size?: number;
};

type MetricTileProps = {
  icon: WattIconName;
  label: string;
  value: string;
  helper?: string;
  delta?: string;
  colors?: readonly [string, string];
};

type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
};

export const wattGradients = {
  blue: ['#1e88ff', '#255be8'] as const,
  amber: ['#ffd66b', '#f6b83f'] as const,
  green: ['#85d46f', '#59ba68'] as const,
  violet: ['#7b7cf4', '#6953e8'] as const,
};

export function ScreenScroll({
  children,
  gap = 16,
  horizontalPadding = 20,
  topPadding = 12,
  bottomPadding = 112,
}: ScreenScrollProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical
      overScrollMode="always"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
        gap,
        paddingHorizontal: horizontalPadding,
        paddingTop: Math.max(insets.top + topPadding, 24),
        paddingBottom: bottomPadding + insets.bottom,
      }}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  leftIcon,
  leftLabel,
  rightIcon,
  onLeftPress,
  onRightPress,
  rightLabel,
  titleAlign = 'center',
}: ScreenHeaderProps) {
  const theme = useAppTheme();
  const isLeftAligned = titleAlign === 'left';

  return (
    <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
      {leftIcon ? <IconButton icon={leftIcon} label={leftLabel ?? 'Menu'} onPress={onLeftPress} /> : isLeftAligned ? null : <View style={{ width: 44 }} />}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: theme.accent,
          fontSize: 20,
          textAlign: isLeftAligned ? 'left' : 'center',
          fontFamily: fontFamilies.displayMedium,
        }}
      >
        {title}
      </Text>
      {rightIcon ? (
        <IconButton icon={rightIcon} label={rightLabel ?? 'Action'} onPress={onRightPress} />
      ) : (
        <View style={{ width: 44 }} />
      )}
    </View>
  );
}

export function IconButton({ icon, label, onPress, selected = false }: IconButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 44,
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        borderCurve: 'continuous',
        backgroundColor: selected ? theme.accentSoft : 'transparent',
        opacity: pressed ? 0.66 : 1,
      })}
    >
      <Ionicons name={icon} size={23} color={selected ? theme.accent : theme.text} />
    </Pressable>
  );
}

export function SoftCard({ children, style, padding = 14, tone = 'default' }: SoftCardProps) {
  const theme = useAppTheme();
  const backgroundColor =
    tone === 'blue'
      ? '#f0f6ff'
      : tone === 'green'
        ? '#effaf1'
        : tone === 'amber'
          ? '#fff8e9'
          : tone === 'plain'
            ? theme.background
            : theme.surface;

  return (
    <View
      style={[
        {
          gap: 12,
          overflow: 'hidden',
          borderRadius: 14,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor,
          padding,
          boxShadow: theme.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconSquare({ icon, colors = wattGradients.blue, size = 52 }: IconSquareProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: size,
        width: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderCurve: 'continuous',
      }}
    >
      <Ionicons name={icon} size={Math.max(22, size * 0.48)} color="#ffffff" />
    </LinearGradient>
  );
}

export function MetricTile({ icon, label, value, helper, delta, colors = wattGradients.blue }: MetricTileProps) {
  const theme = useAppTheme();

  return (
    <SoftCard padding={12} style={{ flex: 1, minWidth: 142, minHeight: 132 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSquare icon={icon} colors={colors} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={{ color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
            {label}
          </Text>
        </View>
      </View>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
        style={{ width: '100%', color: theme.text, fontSize: 24, fontFamily: fontFamilies.bodyHeavy, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <View style={{ minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: theme.textSubtle, fontSize: 11, fontFamily: fontFamilies.body }}>
          {helper ?? 'vs yesterday'}
        </Text>
        {delta ? (
          <Text style={{ color: theme.primaryChart, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>{delta}</Text>
        ) : null}
      </View>
    </SoftCard>
  );
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={{ minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: theme.text, fontSize: 16, fontFamily: fontFamilies.bodyHeavy }}>{title}</Text>
      {action}
    </View>
  );
}

export function DatePill({ label, icon = 'calendar-outline' }: { label: string; icon?: WattIconName }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        paddingHorizontal: 12,
      }}
    >
      <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>
        {label}
      </Text>
      <Ionicons name={icon} size={15} color={theme.textMuted} />
    </View>
  );
}

export function ListChevron() {
  const theme = useAppTheme();
  return <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />;
}
