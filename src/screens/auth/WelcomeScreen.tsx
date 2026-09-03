import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';

type Props = {
  onStart: () => void;
  onLogin: () => void;
};

export function WelcomeScreen({ onStart, onLogin }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Usable height inside safe area — scale mascot so header + CTA always fit.
  const available = Math.max(480, height - insets.top - insets.bottom);
  const compact = available < 700;
  const tight = available < 640;

  const headerBudget = tight ? 132 : compact ? 148 : 168;
  const footerBudget = tight ? 128 : 140;
  const mascotHeight = Math.max(
    120,
    Math.min(available - headerBudget - footerBudget, width * (tight ? 0.58 : 0.7), tight ? 220 : 300),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.layout}>
          <View style={[styles.header, tight && styles.headerTight]}>
            <Text style={[styles.logo, tight && styles.logoTight]}>TAILIO</Text>
            <Text style={[styles.title, compact && styles.titleCompact, tight && styles.titleTight]}>
              Понимать.{'\n'}Заботиться.{'\n'}Быть рядом.
            </Text>
          </View>

          <View style={[styles.hero, { height: mascotHeight }]}>
            <Image
              source={require('../../../assets/brand/welcome-mascot.png')}
              style={{ width: '100%', height: mascotHeight }}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.footer, tight && styles.footerTight]}>
            <Button label="Начать" onPress={onStart} style={styles.cta} />
            <Button label="Уже есть аккаунт" variant="ghost" onPress={onLogin} />
          </View>
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
  layout: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 0,
  },
  header: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTight: {
    paddingTop: 4,
  },
  logo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: 0.4,
    color: '#000000',
    textTransform: 'uppercase',
  },
  logoTight: {
    fontSize: 20,
    lineHeight: 26,
  },
  title: {
    marginTop: 24,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    color: '#141414',
  },
  titleCompact: {
    marginTop: 14,
    fontSize: 28,
    lineHeight: 34,
  },
  titleTight: {
    marginTop: 10,
    fontSize: 24,
    lineHeight: 30,
  },
  hero: {
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    overflow: 'hidden',
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 2,
  },
  footerTight: {
    paddingBottom: 4,
  },
  cta: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 343,
    backgroundColor: '#8B7FFF',
  },
});
