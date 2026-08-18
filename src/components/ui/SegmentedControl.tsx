import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, type } from '../../theme';

type Item<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  items: Item<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ items, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    padding: 4,
  },
  item: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.ink,
  },
  label: {
    ...type.caption,
    color: colors.muted,
    fontFamily: 'Inter_600SemiBold',
  },
  labelActive: {
    color: colors.white,
  },
});
