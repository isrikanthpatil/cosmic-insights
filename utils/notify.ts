import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert. React Native's Alert.alert is a no-op on web, so on
 * web we fall back to the browser's native alert dialog. This guarantees the
 * user always sees error/success messages regardless of platform.
 */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Cross-platform confirmation dialog. Calls onConfirm only if the user accepts.
 * Uses window.confirm on web and a two-button Alert on native.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = 'OK'
) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
