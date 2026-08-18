import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '../../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  value: string;
  background: string;
  hint?: string;
  onPress?: () => void;
};

export function MetricTile({ icon, iconColor, title, value, background, hint, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: background }]}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.lg,
    padding: 14,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...type.caption,
    color: colors.inkSoft,
  },
  value: {
    marginTop: 12,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
  },
  hint: {
    ...type.caption,
    color: colors.green,
    marginTop: 6,
  },
});
