import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius } from '../../theme';

type Props = ViewProps & {
  padded?: boolean;
};

export function Card({ padded = true, style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  padded: {
    padding: 16,
  },
});
