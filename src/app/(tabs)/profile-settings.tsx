import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { notificationService } from '@/services/notification.service';
import { useSettingsStore } from '@/stores/settings.store';
import { useSystemStore } from '@/stores/system.store';
import { fontFamilies } from '@/theme/typography';

const colors = {
  background: '#101011',
  header: '#1f1d23',
  divider: 'rgba(255, 255, 255, 0.16)',
  text: '#eceaf1',
  muted: '#b7b5bf',
  subtle: '#77757f',
  accent: '#bcc2ff',
  danger: '#ef4444',
  pressed: 'rgba(255, 255, 255, 0.06)',
  switchTrack: '#bcc2ff',
  switchOff: '#55545d',
  switchThumb: '#0f172a',
} as const;

type SettingsRowProps = {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  danger?: boolean;
  action?: React.ReactNode;
  onPress?: () => void;
};

function Header({ title }: { title: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        minHeight: 76 + insets.top,
        paddingTop: insets.top,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 26,
        backgroundColor: colors.header,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}
      >
        <Ionicons name="arrow-back" size={36} color={colors.muted} />
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 32, fontFamily: fontFamilies.displayMedium }}>{title}</Text>
    </View>
  );
}

function SettingsRow({ icon, title, subtitle, disabled = false, danger = false, action, onPress }: SettingsRowProps) {
  const content = (
    <View
      style={{
        minHeight: 86,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        paddingHorizontal: 34,
      }}
    >
      <View style={{ width: 50, alignItems: 'center' }}>
        <Ionicons name={icon} size={31} color={danger ? colors.danger : disabled ? colors.subtle : colors.muted} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            color: danger ? colors.danger : disabled ? colors.subtle : colors.text,
            fontSize: 22,
            fontFamily: fontFamilies.body,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: disabled ? colors.subtle : colors.accent, fontSize: 18, fontFamily: fontFamilies.body }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ backgroundColor: pressed ? colors.pressed : 'transparent' })}>
      {content}
    </Pressable>
  );
}

function SectionDivider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

function formatTheme(value: string) {
  if (value === 'dark') {
    return 'Dark';
  }
  if (value === 'light') {
    return 'Light';
  }
  return 'System';
}

export default function ProfileSettingsScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const systemProfile = useSystemStore((state) => state.systemProfile);
  const nextTheme = settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'system' : 'dark';
  const reminderSubtitle = settings.reminderEnabled ? settings.reminderTime ?? '19:00' : 'Off';

  const toggleReminder = async (value: boolean) => {
    try {
      if (value) {
        const reminderTime = settings.reminderTime ?? '19:00';
        await notificationService.enableDailyReminder(reminderTime);
        await updateSettings({ reminderEnabled: true, reminderTime });
        return;
      }

      await notificationService.disableDailyReminder();
      await updateSettings({ reminderEnabled: false, reminderTime: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update notifications.';
      Alert.alert('Notifications not updated', message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false} alwaysBounceVertical={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <SettingsRow icon="globe-outline" title="Language" subtitle="Default" />
        <SettingsRow icon="color-palette-outline" title="Theme" subtitle={formatTheme(settings.theme)} onPress={() => void updateSettings({ theme: nextTheme })} />

        <SectionDivider />

        <SettingsRow icon="enter-outline" title="Startup screen" subtitle="Home" />
        <SettingsRow icon="speedometer-outline" title="Budget" subtitle="ROI tracking" action={<Switch value trackColor={{ true: colors.switchTrack, false: colors.switchOff }} thumbColor={colors.switchThumb} />} />
        <SettingsRow icon="finger-print-outline" title="Passcode" subtitle="Disabled" disabled />
        <SettingsRow
          icon="notifications-outline"
          title="Notifications"
          subtitle={reminderSubtitle}
          action={<Switch value={settings.reminderEnabled} onValueChange={(value) => void toggleReminder(value)} trackColor={{ true: colors.switchTrack, false: colors.switchOff }} thumbColor={colors.switchThumb} />}
          onPress={() => router.push('/(tabs)/settings' as never)}
        />

        <SectionDivider />

        <SettingsRow icon="cash-outline" title="Default currency" subtitle="Philippine peso – ₱" />
        <SettingsRow icon="keypad-outline" title="Currency format" subtitle="₱1,234,567.90" />
        <SettingsRow icon="calendar-outline" title="First day of week" subtitle="Sunday" />
        <SettingsRow icon="calendar-number-outline" title="First day of month" subtitle={`${systemProfile?.billingCycleStartDay ?? 1}`} />
      </ScrollView>
    </View>
  );
}
