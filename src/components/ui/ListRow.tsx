import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '../../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  done?: boolean;
  onPress: () => void;
};

export function ListRow({ icon, title, subtitle, badge, done, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.row, done && styles.done]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={colors.purple} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, done && styles.strike]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  done: {
    opacity: 0.55,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  subtitle: {
    ...type.caption,
    color: colors.muted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    ...type.caption,
    color: colors.orange,
  },
});
