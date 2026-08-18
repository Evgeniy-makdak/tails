import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';
import type { SleepPhase } from '../../types/pet';

type Props = {
  phases: SleepPhase[];
};

export function SleepBar({ phases }: Props) {
  return (
    <View>
      <View style={styles.bar}>
        {phases.map((phase) => (
          <View
            key={phase.id}
            style={{ flex: phase.flex, backgroundColor: phase.color, height: 10 }}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {phases.map((phase) => (
          <View key={phase.id} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: phase.color }]} />
            <Text style={styles.legendText}>{phase.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...type.caption,
    color: colors.muted,
  },
});
