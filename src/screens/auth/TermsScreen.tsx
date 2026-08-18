import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { colors, radius, spacing, type } from '../../theme';

type Props = {
  onNext: () => void;
  onBack: () => void;
};

export function TermsScreen({ onNext, onBack }: Props) {
  const [terms, setTerms] = useState(false);
  const [tips, setTips] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.title}>Условия использования и политика конфиденциальности</Text>
        <Text style={styles.copy}>Пожалуйста, ознакомьтесь с условиями ниже, чтобы продолжить</Text>
        <Pressable style={styles.checkRow} onPress={() => setTerms((value) => !value)}>
          <View style={[styles.box, terms && styles.boxOn]} />
          <Text style={styles.checkText}>
            Я ознакомился(ась) и принимаю <Text style={styles.link}>Условия использования</Text> и{' '}
            <Text style={styles.link}>Политику конфиденциальности</Text> Tailio
          </Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setTips((value) => !value)}>
          <View style={[styles.box, tips && styles.boxOn]} />
          <Text style={styles.checkText}>
            Получать полезные рекомендации, советы по уходу и уведомления, связанные со здоровьем и безопасностью питомца
          </Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Button label="Продолжить" disabled={!terms} onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  back: {
    height: 44,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.ink,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  copy: {
    ...type.body,
    color: colors.muted,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    marginTop: 2,
  },
  boxOn: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  checkText: {
    ...type.body,
    flex: 1,
    color: colors.inkSoft,
  },
  link: {
    color: '#3B82F6',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
