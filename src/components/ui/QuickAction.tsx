import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '../../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  background: string;
  color: string;
  onPress: () => void;
};

export function QuickAction({ icon, label, background, color, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <View style={[styles.tile, { backgroundColor: background }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  tile: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 74,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.caption,
    color: colors.inkSoft,
  },
});
