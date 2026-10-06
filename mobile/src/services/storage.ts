import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sahyatri_access_token';
const REFRESH_TOKEN_KEY = 'sahyatri_refresh_token';

let memoryStorage: Record<string, string> = {};

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch (e) {
    return false;
  }
}

export const StorageService = {
  async setAccessToken(token: string): Promise<void> {
    const isSecure = await isSecureStoreAvailable();
    if (isSecure) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } else {
      memoryStorage[ACCESS_TOKEN_KEY] = token;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
      }
    }
  },

  async getAccessToken(): Promise<string | null> {
    const isSecure = await isSecureStoreAvailable();
    if (isSecure) {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(ACCESS_TOKEN_KEY);
      }
      return memoryStorage[ACCESS_TOKEN_KEY] || null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    const isSecure = await isSecureStoreAvailable();
    if (isSecure) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } else {
      memoryStorage[REFRESH_TOKEN_KEY] = token;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    }
  },

  async getRefreshToken(): Promise<string | null> {
    const isSecure = await isSecureStoreAvailable();
    if (isSecure) {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return memoryStorage[REFRESH_TOKEN_KEY] || null;
    }
  },

  async clearTokens(): Promise<void> {
    const isSecure = await isSecureStoreAvailable();
    if (isSecure) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    delete memoryStorage[ACCESS_TOKEN_KEY];
    delete memoryStorage[REFRESH_TOKEN_KEY];
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
