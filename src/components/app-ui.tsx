import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { fontFamilies } from '@/theme/typography';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];
export type AppMaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type AppIconFamily = 'ionicons' | 'material-community';
type AppIconValue = AppIconName | AppMaterialCommunityIconName;

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
  icon: AppIconValue;
  iconFamily?: AppIconFamily;
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
  icon: AppIconValue;
  iconFamily?: AppIconFamily;
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

function AppVectorIcon({
  icon,
  iconFamily = 'ionicons',
  size,
  color,
}: {
  icon: AppIconValue;
  iconFamily?: AppIconFamily;
  size: number;
  color: string;
}) {
  if (iconFamily === 'material-community') {
    return <MaterialCommunityIcons name={icon as AppMaterialCommunityIconName} size={size} color={color} />;
  }

  return <Ionicons name={icon as AppIconName} size={size} color={color} />;
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
      style={[
        {
          gap: 16,
          borderRadius: 28,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: tone === 'inverse' ? 'rgba(255, 255, 255, 0.08)' : theme.border,
          backgroundColor,
          padding: padding + 2,
          boxShadow: tone === 'inverse' ? '0 26px 70px rgba(1, 3, 10, 0.46)' : theme.shadow,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBadge({ icon, iconFamily = 'ionicons', tone = 'accent', size = 42 }: IconBadgeProps) {
  const theme = useAppTheme();
  const palette = getIconColors(tone, theme);

  return (
    <View
      style={{
        height: size,
        width: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Math.max(16, size / 2.4),
        borderCurve: 'continuous',
        backgroundColor: palette.backgroundColor,
        borderWidth: 1,
        borderColor: tone === 'inverse' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      }}
    >
      <AppVectorIcon icon={icon} iconFamily={iconFamily} size={Math.max(18, size * 0.44)} color={palette.color} />
    </View>
  );
}

export function SectionTitle({ title, description, icon, action, eyebrow }: SectionTitleProps) {
  const theme = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
      <View style={{ flex: 1, gap: 6 }}>
        {eyebrow ? (
          <Text
            style={{
              color: theme.accent,
              fontSize: 11,
              fontFamily: fontFamilies.bodyStrong,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {icon ? <IconBadge icon={icon} size={36} /> : null}
          <Text
            selectable
            style={{
              flexShrink: 1,
              color: theme.text,
              fontSize: 22,
              fontFamily: fontFamilies.displayMedium,
            }}
          >
            {title}
          </Text>
        </View>
        {description ? (
          <Text
            selectable
            style={{
              color: theme.textMuted,
              fontSize: 14,
              lineHeight: 20,
              fontFamily: fontFamilies.body,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View style={{ justifyContent: 'flex-start' }}>{action}</View> : null}
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
          : { backgroundColor: theme.accent, borderColor: theme.accent, color: '#0a101b' };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: fullWidth ? '100%' : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 999,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: palette.borderColor,
          backgroundColor: palette.backgroundColor,
          paddingHorizontal: 18,
          paddingVertical: 13,
          opacity: disabled ? 0.6 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={palette.color} /> : null}
      <Text style={{ color: palette.color, fontSize: 14, fontFamily: fontFamilies.bodyStrong }}>{label}</Text>
    </Pressable>
  );
}

export function StatPill({ icon, iconFamily = 'ionicons', label, value, tone = 'default' }: StatPillProps) {
  const theme = useAppTheme();
  const highlightColor = tone === 'accent' ? theme.accent : tone === 'warning' ? theme.warningText : theme.text;

  return (
    <View
      style={{
        minWidth: 124,
        flex: 1,
        gap: 8,
        borderRadius: 22,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBadge icon={icon} iconFamily={iconFamily} tone={tone === 'accent' ? 'accent' : tone === 'warning' ? 'warning' : 'muted'} size={32} />
        <Text
          selectable
          style={{
            color: theme.textMuted,
            fontSize: 12,
            fontFamily: fontFamilies.bodyStrong,
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
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.border,
        backgroundColor: selected ? theme.accentSoft : theme.surfaceRaised,
        paddingHorizontal: 14,
        paddingVertical: 10,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? theme.accent : theme.textMuted} /> : null}
      <Text
        style={{
          color: selected ? theme.accent : theme.textMuted,
          fontSize: 13,
          fontFamily: fontFamilies.bodyStrong,
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
        style={{
          flex: 1,
          justifyContent: variant === 'dialog' ? 'center' : 'flex-end',
          backgroundColor: theme.scrim,
          padding: 20,
        }}
      >
        <Pressable
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />
        <Animated.View
          entering={variant === 'dialog' ? ZoomIn.duration(220) : SlideInUp.duration(260)}
          style={{
            maxHeight: variant === 'dialog' ? 520 : 640,
            width: '100%',
            alignSelf: 'center',
            gap: 16,
            borderRadius: 32,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surfaceOverlay,
            padding: 22,
            paddingBottom: Math.max(insets.bottom, 16),
            boxShadow: theme.shadow,
          }}
        >
          {variant === 'drawer' ? (
            <View
              style={{
                alignSelf: 'center',
                width: 52,
                height: 5,
                borderRadius: 999,
                backgroundColor: theme.border,
              }}
            />
          ) : null}
          <SectionTitle title={title} description={description} />
          <ScrollView
            contentContainerStyle={{ gap: 16 }}
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical
            overScrollMode="always"
          >
            {children}
          </ScrollView>
          {footer ? footer : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
