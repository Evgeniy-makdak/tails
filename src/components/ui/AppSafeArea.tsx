import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { useWebPhonePreview } from '../../utils/useWebPhonePreview';

const PHONE_INSETS = { top: 44, left: 0, right: 0, bottom: 24 };
const PHONE_FRAME = { x: 0, y: 0, width: 390, height: 844 };

type Props = {
  children: ReactNode;
};

export function AppSafeArea({ children }: Props) {
  const phonePreview = useWebPhonePreview();

  if (Platform.OS === 'web' && phonePreview) {
    return (
      <SafeAreaFrameContext.Provider value={PHONE_FRAME}>
        <SafeAreaInsetsContext.Provider value={PHONE_INSETS}>{children}</SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    );
  }

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
