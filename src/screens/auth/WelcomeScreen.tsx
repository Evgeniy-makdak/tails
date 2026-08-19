import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';

type Props = {
  onStart: () => void;
  onLogin: () => void;
};

export function WelcomeScreen({ onStart, onLogin }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.logo}>TAILIO</Text>
          <Text style={styles.title}>Понимать.{'\n'}Заботиться.{'\n'}Быть рядом.</Text>
        </View>

        <View style={styles.hero}>
          <Image
            source={require('../../../assets/brand/welcome-mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        <View style={styles.footer}>
          <Button label="Начать" onPress={onStart} style={styles.cta} />
          <Button label="Уже есть аккаунт" variant="ghost" onPress={onLogin} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  logo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: 0.4,
    color: '#000000',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 28,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    color: '#141414',
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    minHeight: 0,
  },
  mascot: {
    width: '108%',
    height: '100%',
    marginRight: -24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cta: {
    alignSelf: 'center',
    width: 343,
    backgroundColor: '#8B7FFF',
  },
});
