import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingArt } from '../../components/illustrations/OnboardingArt';
import { Button } from '../../components/ui/Button';
import { useI18n, type MessageKey } from '../../i18n';
import { colors, spacing, type } from '../../theme';

type Slide = {
  key: 'care' | 'rhythm' | 'nearby';
  title: MessageKey;
  body: MessageKey;
};

const SLIDES: Slide[] = [
  { key: 'care', title: 'onboarding_slideOneTitle', body: 'onboarding_slideOneBody' },
  { key: 'rhythm', title: 'onboarding_slideTwoTitle', body: 'onboarding_slideTwoBody' },
  { key: 'nearby', title: 'onboarding_slideThreeTitle', body: 'onboarding_slideThreeBody' },
];

type Props = {
  onSkip: () => void;
  onDone: () => void;
};

export function OnboardingScreen({ onSkip, onDone }: Props) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = SLIDES[index] ?? SLIDES[0]!;
  const isLast = index === SLIDES.length - 1;

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setIndex(next);
  };

  const next = () => {
    if (isLast) {
      onDone();
      return;
    }
    goTo(index + 1);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -40 && index < SLIDES.length - 1) {
            goTo(index + 1);
          }
          if (gesture.dx > 40 && index > 0) {
            goTo(index - 1);
          }
        },
      }),
    [index],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.brand}>{t('brandName')}</Text>
        <Button label={t('common_skip')} variant="ghost" onPress={onSkip} style={styles.skip} />
      </View>

      <View style={styles.body} {...panResponder.panHandlers}>
        <Animated.View style={[styles.art, { opacity: fade }]}>
          <OnboardingArt slide={slide.key} />
        </Animated.View>
        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.title}>{t(slide.title)}</Text>
          <Text style={styles.copy}>{t(slide.body)}</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((item, dotIndex) => (
            <View
              key={item.key}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button label={isLast ? t('onboarding_enterApp') : t('common_next')} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.linen,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...type.subtitle,
    color: colors.terracottaDark,
  },
  skip: {
    minHeight: 40,
    paddingHorizontal: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  art: {
    marginBottom: spacing.xl,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  copy: {
    ...type.body,
    color: colors.inkSoft,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.terracottaSoft,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.terracotta,
  },
});
