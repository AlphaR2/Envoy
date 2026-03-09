import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN:  'envoy_access_token',
  REFRESH_TOKEN: 'envoy_refresh_token',
} as const;

export const tokenStorage = {
  async saveTokens(access: string, refresh: string) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh);
  },
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  },
};
