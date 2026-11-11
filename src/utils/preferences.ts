import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PREFIX = 'haeboyang.preference.';

export async function readPreference<T>(key: string, fallback: T): Promise<T> {
  let value: string | null = null;
  if (Platform.OS === 'web') {
    try {
      value = globalThis.localStorage?.getItem(`${PREFIX}${key}`) ?? null;
    } catch {
      return fallback;
    }
  } else {
    value = await SecureStore.getItemAsync(`${PREFIX}${key}`);
  }
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function writePreference<T>(key: string, value: T) {
  const serialized = JSON.stringify(value);
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(`${PREFIX}${key}`, serialized);
    } catch {
      // Keep the in-memory choice if browser storage is unavailable.
    }
    return;
  }
  await SecureStore.setItemAsync(`${PREFIX}${key}`, serialized);
}
