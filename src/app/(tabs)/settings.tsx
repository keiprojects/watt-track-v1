import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppIconName } from '@/components/app-ui';
import { notificationService } from '@/services/notification.service';
import { useSettingsStore } from '@/stores/settings.store';
import { fontFamilies } from '@/theme/typography';

const colors = {
  background: '#101011',
  header: '#1f1d23',
  divider: 'rgba(255, 255, 255, 0.16)',
  rowPressed: 'rgba(255, 255, 255, 0.06)',
  text: '#eceaf1',
  muted: '#b7b5bf',
  subtle: '#77757f',
  accent: '#bcc2ff',
  input: '#17171a',
  switchTrack: '#bcc2ff',
  switchOff: '#55545d',
  switchThumb: '#0f172a',
} as const;

type RowProps = {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onPress?: () => void;
};

function Header() {
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
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
        <Ionicons name="arrow-back" size={36} color={colors.muted} />
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 32, fontFamily: fontFamilies.displayMedium }}>Notifications</Text>
    </View>
  );
}

function Row({ icon, title, subtitle, action, onPress }: RowProps) {
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
        <Ionicons name={icon} size={31} color={colors.muted} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontFamily: fontFamilies.body }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.accent, fontSize: 18, fontFamily: fontFamilies.body }}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ backgroundColor: pressed ? colors.rowPressed : 'transparent' })}>
      {content}
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ color: colors.accent, fontSize: 23, fontFamily: fontFamilies.bodyStrong, paddingHorizontal: 34, paddingTop: 28, paddingBottom: 14 }}>{title}</Text>;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

export default function NotificationsScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime ?? '19:00');

  useEffect(() => {
    setReminderTime(settings.reminderTime ?? '19:00');
  }, [settings.reminderTime]);

  const saveReminder = async () => {
    try {
      await notificationService.enableDailyReminder(reminderTime);
      await updateSettings({ reminderEnabled: true, reminderTime });
      Alert.alert('Notifications enabled', `Daily reading reminders are set for ${reminderTime}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save notification settings.';
      Alert.alert('Notification not saved', message);
    }
  };

  const toggleReminder = async (value: boolean) => {
    try {
      if (value) {
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
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} alwaysBounceVertical={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle title="Reminder" />
        <Row
          icon="notifications-outline"
          title="Daily reminder"
          subtitle={settings.reminderEnabled ? reminderTime : 'Off'}
          action={<Switch value={settings.reminderEnabled} onValueChange={(value) => void toggleReminder(value)} trackColor={{ true: colors.switchTrack, false: colors.switchOff }} thumbColor={colors.switchThumb} />}
        />
        <View style={{ minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 34 }}>
          <View style={{ width: 50, alignItems: 'center' }}>
            <Ionicons name="alarm-outline" size={31} color={colors.muted} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontFamily: fontFamilies.body }}>Reminder time</Text>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="19:00"
              placeholderTextColor={colors.subtle}
              style={{
                borderRadius: 16,
                borderCurve: 'continuous',
                backgroundColor: colors.input,
                color: colors.accent,
                fontSize: 18,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontFamily: fontFamilies.body,
              }}
            />
          </View>
        </View>
        <Row icon="checkmark-circle-outline" title="Save notification" subtitle="Apply daily reminder schedule" onPress={() => void saveReminder()} />

        <Divider />
        <SectionTitle title="What you’ll receive" />
        <Row icon="reader-outline" title="Reading reminder" subtitle="Opens the Readings screen" />
        <Row icon="phone-portrait-outline" title="Local notification" subtitle="Stored on this device only" />
      </ScrollView>
    </View>
  );
}
