import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

const WEB_INSETS = { top: 44, left: 0, right: 0, bottom: 24 };
const WEB_FRAME = { x: 0, y: 0, width: 390, height: 844 };

type Props = {
  children: ReactNode;
};

export function AppSafeArea({ children }: Props) {
  if (Platform.OS === 'web') {
    return (
      <SafeAreaFrameContext.Provider value={WEB_FRAME}>
        <SafeAreaInsetsContext.Provider value={WEB_INSETS}>{children}</SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    );
  }

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
