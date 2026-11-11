import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'haeboyang.accessToken';

export async function readAccessToken() {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function writeAccessToken(token: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } catch {
      // Private browsing may disable local storage; the in-memory session still works.
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAccessToken() {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    } catch {
      // Ignore unavailable browser storage.
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
