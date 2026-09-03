import { Platform, useWindowDimensions } from 'react-native';

/** Desktop web: show the phone bezel preview. Mobile / tablet / PWA: full-screen app. */
export function useWebPhonePreview(): boolean {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web') {
    return false;
  }
  return width >= 768 && height >= 720;
}
