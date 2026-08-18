import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  onFinished: () => void;
};

export function SplashScreen({ onFinished }: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinished, 1600);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Image source={require('../../../assets/brand/tailio-mark.png')} style={styles.mark} resizeMode="contain" />
      <Text style={styles.brand}>TAILIO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 149,
    height: 140,
  },
  brand: {
    marginTop: 18,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 1.2,
    color: '#8B7FFF',
    textTransform: 'uppercase',
  },
});
