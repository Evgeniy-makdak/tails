import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { colors } from '../../theme';
import { useWebPhonePreview } from '../../utils/useWebPhonePreview';

type Props = {
  children: ReactNode;
};

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const PAGE_PADDING = 16;

export function PhoneShell({ children }: Props) {
  const showPreview = useWebPhonePreview();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (Platform.OS !== 'web' || !showPreview) {
    return <View style={styles.fullscreen}>{children}</View>;
  }

  const scale = Math.min(
    1,
    (windowHeight - PAGE_PADDING * 2) / PHONE_HEIGHT,
    (windowWidth - PAGE_PADDING * 2) / PHONE_WIDTH,
  );

  return (
    <View style={styles.page}>
      <View
        style={[
          styles.device,
          {
            width: PHONE_WIDTH * scale,
            height: PHONE_HEIGHT * scale,
            borderRadius: 44 * scale,
            borderWidth: 10 * scale,
          },
        ]}
      >
        <View
          style={[
            styles.deviceInner,
            Platform.OS === 'web'
              ? ({
                  transform: [{ scale }],
                  transformOrigin: 'top left',
                } as object)
              : { transform: [{ scale }] },
          ]}
        >
          <View style={styles.island} />
          <View style={styles.screen}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    minHeight: '100%' as unknown as number,
    backgroundColor: colors.bg,
  },
  page: {
    flex: 1,
    minHeight: '100%' as unknown as number,
    backgroundColor: colors.linenDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PAGE_PADDING,
  },
  device: {
    overflow: 'hidden',
    backgroundColor: colors.linen,
    borderColor: colors.ink,
    shadowColor: colors.ink,
    shadowOpacity: 0.22,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
  },
  deviceInner: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
  },
  island: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 118,
    height: 34,
    borderRadius: 20,
    backgroundColor: colors.ink,
    zIndex: 20,
  },
  screen: {
    flex: 1,
    height: PHONE_HEIGHT - 20,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    position: 'relative',
  },
});
