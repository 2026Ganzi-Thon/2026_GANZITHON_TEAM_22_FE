import { Platform } from 'react-native';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { readPreference } from '@/utils/preferences';

const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export async function getNotificationsEnabledPreference() {
  return readPreference(NOTIFICATIONS_ENABLED_KEY, true);
}

export async function requestLocalNotificationPermission() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('study-reminders', {
      name: '다음 공부 알림',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function hasLocalNotificationPermission() {
  if (Platform.OS === 'web') return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function scheduleStartReminder(reminderId: string, remindAt: string, requestPermission = true) {
  if (Platform.OS === 'web') return false;
  await cancelStartReminder(reminderId);
  if (!(await getNotificationsEnabledPreference())) return false;
  const granted = requestPermission
    ? await requestLocalNotificationPermission()
    : (await Notifications.getPermissionsAsync()).granted;
  if (!granted) return false;
  const date = new Date(remindAt);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '다시 같이 공부할 시간이야',
      body: '준비되면 우리랑 다시 시작하자.',
      data: { reminderId },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === 'android' ? { channelId: 'study-reminders' } : {}),
    },
  });
  return true;
}

export async function cancelStartReminder(reminderId: string) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((item) => item.content.data?.reminderId === reminderId);
  await Promise.all(matching.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function clearStaleStartReminders(activeReminderId?: string) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const stale = scheduled.filter((item) => {
    const reminderId = item.content.data?.reminderId;
    return typeof reminderId === 'string' && reminderId !== activeReminderId;
  });
  await Promise.all(stale.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function cancelAllStartReminders() {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminders = scheduled.filter((item) => typeof item.content.data?.reminderId === 'string');
  await Promise.all(reminders.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
