import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { newClientRequestId, registerPushDevice, removePushDevice, sendStudyPresence, type PresenceEvent } from '@/services/backend';
import { apiErrorCode } from '@/services/chatRecovery';
import { getNotificationsEnabledPreference, hasLocalNotificationPermission, requestLocalNotificationPermission } from '@/services/localNotifications';
import { readPreference, writePreference } from '@/utils/preferences';

export const supportsRemotePush = () => Platform.OS !== 'web' && Device.isDevice
  && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type Installation = { id: string; sequence: number };
let installationPromise: Promise<Installation> | null = null;
let registration: Promise<string | null> | null = null;
let registeredId: string | null = null;
let eventQueue: Promise<unknown> = Promise.resolve();

function installation() {
  if (!installationPromise) {
    installationPromise = (async () => {
      const saved = await readPreference<Installation | null>('pushInstallation', null);
      if (saved) return saved;
      const fresh = { id: newClientRequestId(), sequence: 0 };
      await writePreference('pushInstallation', fresh);
      return fresh;
    })().catch((error) => { installationPromise = null; throw error; });
  }
  return installationPromise;
}

export function syncPushRegistration(requestPermission = false): Promise<string | null> {
  if (!supportsRemotePush()) return Promise.resolve(null);
  if (registration) return requestPermission
    ? registration.then(() => syncPushRegistration(true))
    : registration;
  registration = (async () => {
    const enabled = await getNotificationsEnabledPreference();
    const permitted = enabled && (requestPermission
      ? await requestLocalNotificationPermission() : await hasLocalNotificationPermission());
    const device = await installation();
    if (!permitted) {
      registeredId = null;
      await removePushDevice(device.id);
      return null;
    }
    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) throw new Error('푸시 알림 프로젝트 설정을 확인해줘.');
    // Android requires a channel before obtaining an Expo push token.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '공부 진행 알림', importance: AndroidImportance.DEFAULT,
      });
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushDevice(device.id, data);
    registeredId = device.id;
    return device.id;
  })().finally(() => { registration = null; });
  return registration;
}

export async function unregisterCurrentPushDevice() {
  if (!supportsRemotePush()) return;
  await registration?.catch(() => undefined);
  const device = await installation();
  await removePushDevice(device.id);
  registeredId = null;
}

export function createPresenceEvent(state: PresenceEvent['state']) {
  // Persist a strictly increasing sequence before transmitting, including across restarts.
  const next = eventQueue.catch(() => undefined).then(async () => {
    const device = await installation();
    device.sequence = Math.max(device.sequence + 1, Date.now());
    await writePreference('pushInstallation', device);
    return { installationId: device.id, eventId: newClientRequestId(), sequence: device.sequence, state };
  });
  eventQueue = next;
  return next;
}

export function isPushDeviceRegistered() { return registeredId !== null; }
export async function waitForPushRegistration() { await registration; }

export async function transmitPresence(sessionId: string, event: PresenceEvent) {
  try {
    return await sendStudyPresence(sessionId, event);
  } catch (error) {
    // A newer foreground event can overtake a delayed background request.
    if (apiErrorCode(error) === 'PRESENCE_SEQUENCE_CONFLICT' || apiErrorCode(error) === 'STUDY_NOT_RUNNING') return null;
    throw error;
  }
}
