import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TailioMark } from '../../components/brand/TailioMark';
import { colors, type } from '../../theme';

type Props = {
  onFinished: () => void;
};

export function SplashScreen({ onFinished }: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinished, 1400);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <TailioMark size={96} />
      <Text style={styles.brand}>TAILIO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  brand: {
    ...type.title,
    letterSpacing: 4,
    color: colors.ink,
  },
});
