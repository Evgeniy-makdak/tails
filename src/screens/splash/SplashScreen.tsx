import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n';

type Props = {
  onFinished: () => void;
};

export function SplashScreen({ onFinished }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(onFinished, 1600);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Image source={require('../../../assets/brand/tailio-mark.png')} style={styles.mark} resizeMode="contain" />
      <Text style={styles.brand}>{t('brandNameUpper')}</Text>
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
