import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme/use-app-theme';
import { fontFamilies, fontWeights } from '@/theme/typography';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

type MotionSectionProps = {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
};

type PanelProps = {
  children: ReactNode;
  tone?: 'default' | 'muted' | 'accent' | 'inverse';
  style?: StyleProp<ViewStyle>;
  padding?: number;
};

type IconBadgeProps = {
  icon: AppIconName;
  tone?: 'accent' | 'muted' | 'danger' | 'warning' | 'inverse';
  size?: number;
};

type SectionTitleProps = {
  title: string;
  description?: string;
  icon?: AppIconName;
  action?: ReactNode;
  eyebrow?: string;
};

type AppButtonProps = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: AppIconName;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type StatPillProps = {
  icon: AppIconName;
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'warning';
};

type SkeletonBlockProps = {
  height: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

type OverlaySheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: 'drawer' | 'dialog';
  children: ReactNode;
  footer?: ReactNode;
};

type ToggleChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: AppIconName;
};

type ScreenContentContainerOptions = {
  gap?: number;
  horizontalPadding?: number;
  topPadding?: number;
  bottomPadding?: number;
};

function getIconColors(
  tone: IconBadgeProps['tone'],
  theme: ReturnType<typeof useAppTheme>,
): { backgroundColor: string; color: string } {
  if (tone === 'warning') {
    return { backgroundColor: theme.warningSoft, color: theme.warningText };
  }

  if (tone === 'danger') {
    return { backgroundColor: theme.dangerSoft, color: theme.dangerText };
  }

  if (tone === 'inverse') {
    return { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: theme.textOnDark };
  }

  if (tone === 'muted') {
    return { backgroundColor: theme.neutralSoft, color: theme.textMuted };
  }

  return { backgroundColor: theme.accentSoft, color: theme.accent };
}

export function MotionSection({ children, index = 0, style }: MotionSectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(260).delay(index * 70)}
      layout={LinearTransition.springify().damping(18).stiffness(140)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function Panel({ children, tone = 'default', style, padding = 20 }: PanelProps) {
  const theme = useAppTheme();
  const backgroundColor =
    tone === 'inverse'
      ? theme.header
      : tone === 'accent'
        ? theme.surfaceAccent
        : tone === 'muted'
          ? theme.surfaceRaised
          : theme.surface;

  return (
    <View
      className="gap-4 overflow-hidden border"
      style={[
        {
          borderRadius: 18,
          borderCurve: 'continuous',
          borderColor: tone === 'inverse' ? 'rgba(255, 255, 255, 0.08)' : theme.border,
          backgroundColor,
          padding: padding + 2,
          boxShadow: tone === 'inverse' ? '0 26px 70px rgba(1, 3, 10, 0.46)' : theme.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBadge({ icon, tone = 'accent', size = 42 }: IconBadgeProps) {
  const theme = useAppTheme();
  const palette = getIconColors(tone, theme);

  return (
    <View
      className="items-center justify-center border"
      style={{
        height: size,
        width: size,
        borderRadius: Math.max(12, size / 2.8),
        borderCurve: 'continuous',
        backgroundColor: palette.backgroundColor,
        borderColor: tone === 'inverse' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      }}
    >
      <Ionicons name={icon} size={Math.max(18, size * 0.44)} color={palette.color} />
    </View>
  );
}

export function SectionTitle({ title, description, icon, action, eyebrow }: SectionTitleProps) {
  const theme = useAppTheme();

  return (
    <View className="flex-row justify-between gap-4">
      <View className="flex-1 gap-1.5">
        {eyebrow ? (
          <Text
            className="uppercase tracking-[1.4px]"
            style={{
              color: theme.accent,
              fontSize: 11,
              fontFamily: fontFamilies.bodyStrong,
              fontWeight: fontWeights.semibold,
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2.5">
          {icon ? <IconBadge icon={icon} size={36} /> : null}
          <Text
            selectable
            className="shrink"
            style={{
              color: theme.text,
              fontSize: 21,
              fontFamily: fontFamilies.displayMedium,
              fontWeight: fontWeights.semibold,
            }}
          >
            {title}
          </Text>
        </View>
        {description ? (
          <Text
            selectable
            className="leading-5"
            style={{
              color: theme.textMuted,
              fontSize: 14,
              fontFamily: fontFamilies.body,
              fontWeight: fontWeights.regular,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="justify-start">{action}</View> : null}
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  tone = 'primary',
  icon,
  fullWidth = true,
  disabled = false,
  style,
}: AppButtonProps) {
  const theme = useAppTheme();
  const palette =
    tone === 'danger'
      ? { backgroundColor: theme.dangerSoft, borderColor: theme.dangerSoft, color: theme.dangerText }
      : tone === 'secondary'
        ? { backgroundColor: theme.surfaceRaised, borderColor: theme.border, color: theme.text }
        : tone === 'ghost'
          ? { backgroundColor: 'transparent', borderColor: theme.border, color: theme.textMuted }
          : { backgroundColor: theme.accent, borderColor: theme.accent, color: theme.accentText };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center justify-center gap-2.5 border px-4 py-3"
      style={({ pressed }) => [
        {
          width: fullWidth ? '100%' : undefined,
          borderRadius: 14,
          borderCurve: 'continuous',
          borderColor: palette.borderColor,
          backgroundColor: palette.backgroundColor,
          opacity: disabled ? 0.6 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={palette.color} /> : null}
      <Text style={{ color: palette.color, fontSize: 14, fontFamily: fontFamilies.bodyStrong, fontWeight: fontWeights.semibold }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatPill({ icon, label, value, tone = 'default' }: StatPillProps) {
  const theme = useAppTheme();
  const highlightColor = tone === 'accent' ? theme.accent : tone === 'warning' ? theme.warningText : theme.text;

  return (
    <View
      className="min-w-[124px] flex-1 gap-2 border p-3.5"
      style={{
        borderRadius: 16,
        borderCurve: 'continuous',
        borderColor: theme.border,
        backgroundColor: theme.surface,
      }}
    >
      <View className="flex-row items-center gap-2">
        <IconBadge icon={icon} tone={tone === 'accent' ? 'accent' : tone === 'warning' ? 'warning' : 'muted'} size={32} />
        <Text
          selectable
          style={{
            color: theme.textMuted,
            fontSize: 12,
            fontFamily: fontFamilies.bodyStrong,
            fontWeight: fontWeights.medium,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        selectable
        style={{
          color: highlightColor,
          fontSize: 19,
          fontFamily: fontFamilies.bodyHeavy,
          fontWeight: fontWeights.bold,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function ToggleChip({ label, selected, onPress, icon }: ToggleChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 border px-3.5 py-2.5"
      style={({ pressed }) => ({
        borderRadius: 999,
        borderCurve: 'continuous',
        borderColor: selected ? theme.accent : theme.border,
        backgroundColor: selected ? theme.accentSoft : theme.surfaceRaised,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? theme.accent : theme.textMuted} /> : null}
      <Text
        style={{
          color: selected ? theme.accent : theme.textMuted,
          fontSize: 13,
          fontFamily: fontFamilies.bodyStrong,
          fontWeight: fontWeights.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SkeletonBlock({
  height,
  width = '100%',
  borderRadius = 16,
  style,
}: SkeletonBlockProps) {
  const theme = useAppTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.38, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function useScreenContentContainerStyle({
  gap = 18,
  horizontalPadding = 20,
  topPadding = 18,
  bottomPadding = 112,
}: ScreenContentContainerOptions = {}): ViewStyle {
  const insets = useSafeAreaInsets();
  const topInset = process.env.EXPO_OS === 'ios' ? 0 : insets.top;

  return {
    gap,
    paddingHorizontal: horizontalPadding,
    paddingTop: topPadding + topInset,
    paddingBottom: bottomPadding + insets.bottom,
  };
}

export function OverlaySheet({
  visible,
  onClose,
  title,
  description,
  variant = 'drawer',
  children,
  footer,
}: OverlaySheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        className={variant === 'dialog' ? 'flex-1 justify-center p-5' : 'flex-1 justify-end p-5'}
        style={{ backgroundColor: theme.scrim }}
      >
        <Pressable onPress={onClose} className="absolute inset-0" />
        <Animated.View
          entering={variant === 'dialog' ? ZoomIn.duration(220) : SlideInUp.duration(260)}
          className="w-full self-center gap-4 border px-5 pt-5"
          style={{
            maxHeight: variant === 'dialog' ? 520 : 640,
            borderRadius: 20,
            borderCurve: 'continuous',
            borderColor: theme.border,
            backgroundColor: theme.surfaceOverlay,
            paddingBottom: Math.max(insets.bottom, 16),
            boxShadow: theme.shadow,
          }}
        >
          {variant === 'drawer' ? <View className="h-1.5 w-12 self-center rounded-full" style={{ backgroundColor: theme.border }} /> : null}
          <SectionTitle title={title} description={description} />
          <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false} alwaysBounceVertical overScrollMode="always">
            {children}
          </ScrollView>
          {footer ? footer : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
