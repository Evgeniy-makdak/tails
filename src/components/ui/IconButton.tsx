import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  dot?: boolean;
};

export function IconButton({ name, onPress, dot = false }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.btn} accessibilityRole="button">
      <Ionicons name={name} size={20} color={colors.ink} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
});
