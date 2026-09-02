import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const APP_STORAGE_KEY = 'hvostik-app-v5';

export async function resetAppData(): Promise<void> {
  await AsyncStorage.removeItem(APP_STORAGE_KEY);
}

/** Hidden reset for demos: open the app with ?reset=1 in the URL. */
export function tryResetFromUrl(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') !== '1') {
    return false;
  }

  window.localStorage.removeItem(APP_STORAGE_KEY);
  params.delete('reset');
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.location.replace(nextUrl);
  return true;
}

export function exposeResetHelperOnWeb(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  (window as Window & { __HVOSTIK_RESET__?: () => void }).__HVOSTIK_RESET__ = () => {
    window.localStorage.removeItem(APP_STORAGE_KEY);
    window.location.reload();
  };
}
