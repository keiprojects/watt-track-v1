import { notificationService } from '@/services/notification.service';
import { storageService } from '@/services/storage.service';

export async function resetLocalAppData(): Promise<void> {
  await notificationService.disableDailyReminder();
  await storageService.clearAllData();
}
