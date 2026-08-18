import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../../theme';

type Props = {
  progress: number;
  color?: string;
};

export function ProgressTrack({ progress, color = colors.green }: Props) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: radius.pill,
  },
});
