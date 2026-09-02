import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * Report delivery model. The report itself is generated instantly on-device, but
 * we deliberately hold it for 1–2 hours so a reading feels individually prepared
 * rather than machine-dumped. We tell the user "ready within 24 hours" and then
 * over-deliver (usually ~1–2h) with a local notification. Once ready, it stays
 * ready forever (instant on every later open).
 */
const KEY = (k: string) => `report_delivery_v1:${k}`;
const MIN_MINUTES = 60;
const MAX_MINUTES = 120;

export type DeliveryStatus = { state: 'preparing' | 'ready'; readyAt: number };

async function scheduleReadyNotification(title: string, readyAt: number) {
  if (Platform.OS === 'web') return;
  try {
    let granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your Astropanth report is ready ✨',
        body: `${title} has been prepared — tap to read it.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(readyAt) } as any,
    });
  } catch {
    // notifications are a nicety, not required for delivery to work
  }
}

/**
 * Returns the current delivery status for a report key, starting the 1–2h
 * "preparing" window (and scheduling the ready notification) the first time.
 */
export async function getOrStartDelivery(key: string, title: string): Promise<DeliveryStatus> {
  try {
    const raw = await AsyncStorage.getItem(KEY(key));
    if (raw) {
      const readyAt = JSON.parse(raw).readyAt as number;
      return { state: Date.now() >= readyAt ? 'ready' : 'preparing', readyAt };
    }
  } catch {
    // fall through and start fresh
  }
  const delayMs = (MIN_MINUTES + Math.floor(Math.random() * (MAX_MINUTES - MIN_MINUTES))) * 60_000;
  const readyAt = Date.now() + delayMs;
  try { await AsyncStorage.setItem(KEY(key), JSON.stringify({ readyAt })); } catch {}
  scheduleReadyNotification(title, readyAt);
  return { state: 'preparing', readyAt };
}

/** Friendly "we'll have it ready by" clock time, e.g. "4:35 PM". */
export function formatReadyBy(readyAt: number): string {
  try {
    return new Date(readyAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}
