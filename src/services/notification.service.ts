import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

const REMINDER_CHANNEL_ID = 'watttrack-daily-reminder';
const REMINDER_NOTIFICATION_ID = 'watttrack-daily-reminder';

function hasGrantedNotificationPermission(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

function parseReminderTime(reminderTime: string): { hour: number; minute: number } {
  const match = reminderTime.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error('Reminder time must use HH:MM in 24-hour format.');
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Reminder time must be between 00:00 and 23:59.');
  }

  return { hour, minute };
}

async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Daily reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Daily WattTrack reminder to add a reading.',
  });
}

export const notificationService = {
  async enableDailyReminder(reminderTime: string): Promise<void> {
    const existingPermissions = await Notifications.getPermissionsAsync();
    const permissions = hasGrantedNotificationPermission(existingPermissions)
      ? existingPermissions
      : await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: true,
          },
        });

    if (!hasGrantedNotificationPermission(permissions)) {
      throw new Error('Notification permission was not granted.');
    }

    const { hour, minute } = parseReminderTime(reminderTime);

    await ensureNotificationChannel();
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_NOTIFICATION_ID,
      content: {
        title: 'Time to log today’s reading',
        body: 'Open WattTrack and save your latest solar and grid numbers.',
        sound: 'default',
        data: { route: '/(tabs)/add' },
      },
      trigger:
        Platform.OS === 'ios'
          ? {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour,
              minute,
              repeats: true,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              channelId: REMINDER_CHANNEL_ID,
            },
    });
  },

  async disableDailyReminder(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  },
};
