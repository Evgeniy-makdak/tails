import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  previewScale?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function DemoMapSurface({ previewScale = 1, children, style }: Props) {
  return (
    <View style={[styles.root, style, { transform: [{ scale: previewScale }] }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#D7E4D2',
    overflow: 'hidden',
  },
});