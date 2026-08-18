import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TailioBlob } from '../../components/brand/TailioMark';
import { Button } from '../../components/ui/Button';
import { colors, spacing, type } from '../../theme';

type Step = 'permission' | 'connect' | 'search' | 'done';

type Props = {
  onFinish: () => void;
  onSkip: () => void;
};

export function CollarScreen({ onFinish, onSkip }: Props) {
  const [step, setStep] = useState<Step>('permission');

  useEffect(() => {
    if (step !== 'search') {
      return;
    }
    const timer = setTimeout(() => setStep('done'), 1600);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.progress}>
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
        <View style={[styles.dash, styles.dashOn]} />
      </View>

      {step === 'permission' ? (
        <View style={styles.permWrap}>
          <View style={styles.permCard}>
            <View style={styles.mapMini} />
            <Text style={styles.permTitle}>Разрешить «TAILIO» использовать ваше местоположение?</Text>
            <Pressable style={styles.permBtn} onPress={() => setStep('connect')}>
              <Text style={styles.permAllow}>Разрешить один раз</Text>
            </Pressable>
            <Pressable style={styles.permBtn} onPress={() => setStep('connect')}>
              <Text style={styles.permAllow}>Разрешить, пока используется приложение</Text>
            </Pressable>
            <Pressable style={styles.permBtn} onPress={onSkip}>
              <Text style={styles.permDeny}>Не разрешать</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 'connect' ? (
        <>
          <View style={styles.body}>
            <TailioBlob size={150} />
            <Text style={styles.title}>Подключите ошейник</Text>
            <Text style={styles.copy}>
              Tailio начнёт отслеживать состояние и безопасность питомца в реальном времени
            </Text>
          </View>
          <View style={styles.footer}>
            <Button label="Подключить" onPress={() => setStep('search')} />
            <Button label="Пропустить" variant="ghost" onPress={onSkip} />
          </View>
        </>
      ) : null}

      {step === 'search' ? (
        <View style={styles.body}>
          <View style={styles.collar}>
            <Ionicons name="hardware-chip-outline" size={42} color={colors.purple} />
          </View>
          <Text style={styles.title}>Поиск устройства</Text>
          <Text style={styles.copy}>Держите ошейник рядом с телефоном</Text>
        </View>
      ) : null}

      {step === 'done' ? (
        <>
          <View style={styles.body}>
            <View style={styles.collar}>
              <Ionicons name="checkmark-circle" size={56} color={colors.green} />
            </View>
            <Text style={styles.title}>Ошейник подключен</Text>
            <Text style={styles.copy}>Можно переходить к главной — всё готово</Text>
          </View>
          <View style={styles.footer}>
            <Button label="Вперёд, к новым делам!" onPress={onFinish} />
          </View>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
  },
  dash: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dashOn: {
    backgroundColor: colors.purple,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  title: {
    ...type.title,
    color: colors.ink,
    textAlign: 'center',
  },
  copy: {
    ...type.body,
    color: colors.muted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  collar: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  permCard: {
    width: '100%',
    backgroundColor: colors.paper,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapMini: {
    height: 88,
    backgroundColor: '#C9D9C4',
  },
  permTitle: {
    ...type.subtitle,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  permBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  permAllow: {
    ...type.body,
    color: '#0670BA',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  permDeny: {
    ...type.body,
    color: colors.red,
  },
});
