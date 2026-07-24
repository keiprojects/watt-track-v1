import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies } from '@/theme/typography';

export type WattIconName = ComponentProps<typeof Ionicons>['name'];
export type WattMaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type WattIconFamily = 'ionicons' | 'material-community';
type WattIconValue = WattIconName | WattMaterialCommunityIconName;

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

type CommandButtonProps = {
  label: string;
  icon: WattIconName;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
  compact?: boolean;
  flex?: number;
};

type SettingsListRowProps = {
  icon: WattIconValue;
  iconFamily?: WattIconFamily;
  title: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

type IconSquareProps = {
  icon: WattIconValue;
  iconFamily?: WattIconFamily;
  colors?: readonly [string, string];
  size?: number;
};

type MetricTileProps = {
  icon: WattIconValue;
  iconFamily?: WattIconFamily;
  label: string;
  value: string;
  helper?: string;
  delta?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'flat';
    tone: 'positive' | 'negative' | 'neutral';
  };
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

function WattVectorIcon({
  icon,
  iconFamily = 'ionicons',
  size,
  color,
}: {
  icon: WattIconValue;
  iconFamily?: WattIconFamily;
  size: number;
  color: string;
}) {
  if (iconFamily === 'material-community') {
    return <MaterialCommunityIcons name={icon as WattMaterialCommunityIconName} size={size} color={color} />;
  }

  return <Ionicons name={icon as WattIconName} size={size} color={color} />;
}

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

export function CommandButton({
  label,
  icon,
  onPress,
  tone = 'default',
  disabled = false,
  compact = false,
  flex,
}: CommandButtonProps) {
  const theme = useAppTheme();
  const primary = tone === 'primary';
  const danger = tone === 'danger';
  const secondary = tone === 'secondary';
  const textColor = primary ? '#ffffff' : danger ? theme.dangerText : secondary ? theme.text : theme.text;
  const iconColor = primary ? '#ffffff' : danger ? theme.dangerText : theme.accent;
  const backgroundColor = primary ? theme.accent : danger ? theme.dangerSoft : secondary ? theme.surface : theme.surface;
  const borderColor = primary ? theme.accent : danger ? theme.dangerSoft : theme.border;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex,
        minHeight: compact ? 46 : 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        borderRadius: compact ? 12 : 14,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor,
        backgroundColor,
        paddingHorizontal: 12,
        opacity: disabled ? 0.48 : pressed ? 0.74 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={{ color: textColor, fontSize: 14, fontFamily: fontFamilies.bodyHeavy }}>{label}</Text>
    </Pressable>
  );
}

export function SoftCard({ children, style, padding = 14, tone = 'default' }: SoftCardProps) {
  const theme = useAppTheme();
  const backgroundColor =
    tone === 'blue'
      ? theme.mode === 'dark'
        ? theme.accentSoft
        : '#f0f6ff'
      : tone === 'green'
        ? theme.mode === 'dark'
          ? theme.statusBackground
          : '#effaf1'
        : tone === 'amber'
          ? theme.warningSoft
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

export function IconSquare({ icon, iconFamily = 'ionicons', colors = wattGradients.blue, size = 52 }: IconSquareProps) {
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
      <WattVectorIcon icon={icon} iconFamily={iconFamily} size={Math.max(22, size * 0.48)} color="#ffffff" />
    </LinearGradient>
  );
}

export function MetricTile({ icon, iconFamily = 'ionicons', label, value, helper, delta, trend, colors = wattGradients.blue }: MetricTileProps) {
  const theme = useAppTheme();
  const trendColor =
    trend?.tone === 'positive' ? theme.statusText : trend?.tone === 'negative' ? theme.dangerText : theme.textSubtle;
  const trendIcon = trend?.direction === 'up' ? 'trending-up' : trend?.direction === 'down' ? 'trending-down' : 'remove';

  return (
    <SoftCard padding={12} style={{ flex: 1, minWidth: 142, minHeight: 132 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconSquare icon={icon} iconFamily={iconFamily} colors={colors} size={46} />
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
        {trend ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name={trendIcon} size={13} color={trendColor} />
            <Text style={{ color: trendColor, fontSize: 12, fontFamily: fontFamilies.bodyStrong }}>{trend.value}</Text>
          </View>
        ) : delta ? (
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

export function SettingsListRow({
  icon,
  iconFamily = 'ionicons',
  title,
  value,
  onPress,
  destructive = false,
}: SettingsListRowProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          height: 32,
          width: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: destructive ? theme.dangerSoft : theme.accentSoft,
        }}
      >
        <WattVectorIcon icon={icon} iconFamily={iconFamily} size={18} color={destructive ? theme.dangerText : theme.accent} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: destructive ? theme.dangerText : theme.text,
          fontSize: 14,
          fontFamily: fontFamilies.bodyStrong,
        }}
      >
        {title}
      </Text>
      {value ? (
        <Text numberOfLines={1} style={{ maxWidth: 132, color: theme.textMuted, fontSize: 12, fontFamily: fontFamilies.body }}>
          {value}
        </Text>
      ) : null}
      {onPress ? <ListChevron /> : null}
    </Pressable>
  );
}

export function ListChevron() {
  const theme = useAppTheme();
  return <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />;
}
