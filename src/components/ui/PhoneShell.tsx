import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

type Props = {
  children: ReactNode;
};

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

export function PhoneShell({ children }: Props) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.page}>
      <View style={styles.device}>
        <View style={styles.island} />
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: '100%' as unknown as number,
    backgroundColor: colors.linenDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  device: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: colors.linen,
    borderWidth: 10,
    borderColor: colors.ink,
    shadowColor: colors.ink,
    shadowOpacity: 0.22,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
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
