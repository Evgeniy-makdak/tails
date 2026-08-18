import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  padded?: boolean;
};

export function InAppSheet({ visible, onClose, children, padded = true }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, padded && styles.padded]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  padded: {
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
});
