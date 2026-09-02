import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';

type Props = {
  onStart: () => void;
  onLogin: () => void;
};

export function WelcomeScreen({ onStart, onLogin }: Props) {
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const mascotMaxHeight = Math.min(compact ? 260 : 340, Math.max(180, height * 0.34));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>TAILIO</Text>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              Понимать.{'\n'}Заботиться.{'\n'}Быть рядом.
            </Text>
          </View>

          <View style={[styles.hero, { maxHeight: mascotMaxHeight }]}>
            <Image
              source={require('../../../assets/brand/welcome-mascot.png')}
              style={[styles.mascot, { maxHeight: mascotMaxHeight }]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.footer}>
            <Button label="Начать" onPress={onStart} style={styles.cta} />
            <Button label="Уже есть аккаунт" variant="ghost" onPress={onLogin} />
          </View>
        </ScrollView>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
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
  titleCompact: {
    marginTop: 16,
    fontSize: 28,
    lineHeight: 34,
  },
  hero: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    minHeight: 160,
  },
  mascot: {
    width: '108%',
    aspectRatio: 1.05,
    marginRight: -24,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  cta: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 343,
    backgroundColor: '#8B7FFF',
  },
});
