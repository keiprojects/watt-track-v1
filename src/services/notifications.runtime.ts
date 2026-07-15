import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export function isNotificationsSupported(): boolean {
  return Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export async function loadNotificationsModule() {
  if (!isNotificationsSupported()) {
    return null;
  }

  return import('expo-notifications');
}

export function getNotificationsUnavailableMessage(): string {
  return 'Notifications are unavailable in Expo Go on Android. Use a development build to enable daily reminders.';
}
