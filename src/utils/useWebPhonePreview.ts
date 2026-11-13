import { Platform, useWindowDimensions } from 'react-native';

export function useWebPhonePreview(): boolean {
  const { width, height } = useWindowDimensions();
  if (Platform.OS !== 'web') {
    return false;
  }
  return width >= 768 && height >= 720;
}
