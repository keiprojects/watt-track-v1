import { Alert } from 'react-native';

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function runAlertedAction({
  action,
  errorTitle,
  errorFallback,
  onSuccess,
}: {
  action: () => Promise<void>;
  errorTitle: string;
  errorFallback: string;
  onSuccess?: () => void;
}): Promise<void> {
  try {
    await action();
    onSuccess?.();
  } catch (error) {
    Alert.alert(errorTitle, getErrorMessage(error, errorFallback));
  }
}
